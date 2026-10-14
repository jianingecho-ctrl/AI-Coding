import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ToolchainTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='judge probe tools ')
        self.base = Path(self.temp.name)
        self.selected = self.base / 'selected-path'
        self.calls = self.base / 'selection-calls'
        self.select = self.base / 'xcode-select'
        self.select.write_text('#!/bin/bash\nprintf "%s\\n" "$*" >> ' + shlex.quote(str(self.calls)) + '\n'
                               'if [ "$*" != "-p" ]; then exit 90; fi\ncat ' + shlex.quote(str(self.selected)) + '\n')
        self.select.chmod(0o755)
        self.xcrun = self.base / 'xcrun'
        self.xcrun.write_text('''#!/bin/bash
if [ "${SDKROOT+x}" = x ] || [ "${TOOLCHAINS+x}" = x ]; then
  echo "fixture: inherited toolchain override was not isolated" >&2
  exit 87
fi
case "$*" in
  '--find swiftc')
    if [ ! -x "$DEVELOPER_DIR/usr/bin/swiftc" ]; then
      echo "fixture: unable to find utility swiftc" >&2; exit 72
    fi
    printf '%s\n' "$DEVELOPER_DIR/usr/bin/swiftc" ;;
  '--sdk macosx --show-sdk-path')
    if [ -f "$DEVELOPER_DIR/sdk-error" ]; then
      cat "$DEVELOPER_DIR/sdk-error" >&2; exit 72
    fi
    cat "$DEVELOPER_DIR/sdk-path" ;;
  '--sdk macosx --show-sdk-version') cat "$DEVELOPER_DIR/sdk-version" ;;
  *) echo 'fixture: unexpected xcrun operation' >&2; exit 86 ;;
esac
''')
        self.xcrun.chmod(0o755)

    def tearDown(self):
        self.temp.cleanup()

    def developer(self, name, version='26.0', swift=True, sdk=True, header=True):
        folder = self.base / name
        (folder / 'usr/bin').mkdir(parents=True)
        if swift:
            compiler = folder / 'usr/bin/swiftc'
            compiler.write_text('#!/bin/bash\nexit 99\n')
            compiler.chmod(0o755)
        sdk_path = folder / 'SDKs/MacOSX.sdk'
        if sdk:
            sdk_path.mkdir(parents=True)
            if header:
                h = sdk_path / 'System/Library/Frameworks/ScreenCaptureKit.framework/Headers/SCScreenshotManager.h'
                h.parent.mkdir(parents=True)
                h.write_text('// fixture: public SDK header\n')
        (folder / 'sdk-path').write_text(str(sdk_path))
        (folder / 'sdk-version').write_text(version)
        return folder

    def resolve(self, active, alternatives=(), overrides=False):
        self.selected.write_text(str(active))
        args = [str(self.select), str(self.xcrun), *(str(p) for p in alternatives)]
        script = '. ' + shlex.quote(str(ROOT / 'toolchain.sh')) + '\n'
        script += 'if judge_probe_select_toolchain ' + shlex.join(args) + '; then\n'
        script += 'printf "SELECTED:%s\\nSDK:%s\\n" "$JUDGE_SELECTED_DEVELOPER" "$JUDGE_SELECTED_SDK_VERSION"\n'
        if overrides:
            script += 'printf "PARENT:%s:%s\\n" "$SDKROOT" "$TOOLCHAINS"\n'
        script += 'else exit 2; fi\n'
        env = os.environ.copy()
        if overrides:
            env.update(SDKROOT='fixture-invalid-sdk', TOOLCHAINS='fixture-invalid-toolchain')
        result = subprocess.run(['bash', '-eu', '-c', script], env=env, text=True, capture_output=True, timeout=10)
        self.assertEqual(self.calls.read_text().splitlines(), ['-p'])
        self.assertFalse((self.base / '.build').exists())
        return result

    def test_active_toolchain_and_paths_with_spaces(self):
        active = self.developer('Current Xcode/Contents/Developer')
        result = self.resolve(active)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('SELECTED:' + str(active), result.stdout)

    def test_isolates_overrides_without_changing_parent_environment(self):
        active = self.developer('Command Line Tools')
        result = self.resolve(active, overrides=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('PARENT:fixture-invalid-sdk:fixture-invalid-toolchain', result.stdout)

    def test_invalid_selection_falls_back_to_installed_tools(self):
        fallback = self.developer('Installed CLT')
        result = self.resolve(self.base / 'Removed Xcode', [fallback])
        self.assertEqual(result.returncode, 0)
        self.assertIn('目录不存在', result.stdout)
        self.assertIn('SELECTED:' + str(fallback), result.stdout)

    def test_missing_compiler_uses_xcode_and_preserves_error(self):
        broken = self.developer('Incomplete CLT', swift=False)
        fallback = self.developer('Xcode/Contents/Developer')
        result = self.resolve(broken, [fallback])
        self.assertEqual(result.returncode, 0)
        self.assertIn('unable to find utility swiftc', result.stdout)
        self.assertIn('SELECTED:' + str(fallback), result.stdout)

    def test_old_sdk_uses_a_newer_installed_sdk(self):
        old = self.developer('Old CLT', version='15.1')
        new = self.developer('New Xcode', version='15.2')
        result = self.resolve(old, [new])
        self.assertEqual(result.returncode, 0)
        self.assertIn('SDK 15.1 过旧', result.stdout)
        self.assertIn('SDK:15.2', result.stdout)

    def test_sdk_error_is_not_reported_as_a_missing_swift(self):
        active = self.developer('Broken SDK')
        (active / 'sdk-error').write_text('fixture: SDK macosx cannot be located')
        result = self.resolve(active)
        self.assertEqual(result.returncode, 2)
        self.assertIn('macOS SDK 查询失败', result.stdout)
        self.assertIn('SDK macosx cannot be located', result.stdout)
        self.assertNotIn('Swift 查询失败', result.stdout)

    def test_missing_sdk_directory_is_rejected(self):
        result = self.resolve(self.developer('SDK Missing', sdk=False))
        self.assertEqual(result.returncode, 2)
        self.assertIn('SDK 目录不存在', result.stdout)

    def test_malformed_sdk_version_is_rejected(self):
        result = self.resolve(self.developer('Unknown SDK', version='unknown'))
        self.assertEqual(result.returncode, 2)
        self.assertIn('无法解析', result.stdout)

    def test_incomplete_framework_is_rejected(self):
        result = self.resolve(self.developer('Incomplete SDK', header=False))
        self.assertEqual(result.returncode, 2)
        self.assertIn('缺少 ScreenCaptureKit', result.stdout)

    @unittest.skipIf(os.uname().sysname == 'Darwin', 'Linux-only platform guard')
    def test_launcher_rejects_linux_before_toolchain_or_capture(self):
        result = subprocess.run(['bash', str(ROOT / '开始验证飞书通知.command')], input='', text=True,
                                capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 2)
        self.assertIn('只能在 Mac 上', result.stdout)
        self.assertFalse((ROOT / '.build').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
