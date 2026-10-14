#!/bin/bash
set -eu
cd "$(dirname "$0")"

finish() {
  echo
  read -r -p "按回车关闭窗口…" _judge_probe_wait || true
}
trap finish EXIT

if [ "$(uname -s)" != "Darwin" ]; then
  echo "本工具只能在 Mac 上验证桌面通知，云端 Linux 无法替代本机测试。"
  exit 2
fi

echo "飞书桌面通知识别验证 · 0.1.1"
echo "仅使用公开的区域截图与本机文字识别，不联网，不保存截图，不接入飞书账号。"
echo "这一步验证可见通知是否能被识别，暂不触发桌宠。"
echo

. ./toolchain.sh
echo "正在分别检查 Swift 编译器与 macOS SDK…"
for variable in SDKROOT DEVELOPER_DIR TOOLCHAINS; do
  if declare -p "$variable" >/dev/null 2>&1; then
    echo "$variable 已设置；编译和查询仅在本次进程使用检测到的工具路径。"
  fi
done
if ! judge_probe_select_toolchain /usr/bin/xcode-select /usr/bin/xcrun \
  /Library/Developer/CommandLineTools \
  /Applications/Xcode.app/Contents/Developer \
  /Applications/Xcode-beta.app/Contents/Developer; then
  echo "若尚未安装开发工具，在终端执行：xcode-select --install"
  echo "已经提示 tools are already installed 时，请反馈上方具体诊断，不必重复执行安装命令。"
  exit 2
fi
printf '本次开发工具：%s\nSwift：%s\nmacOS SDK：%s（%s）\n' \
  "$JUDGE_SELECTED_DEVELOPER" "$JUDGE_SELECTED_SWIFT" "$JUDGE_SELECTED_SDK" "$JUDGE_SELECTED_SDK_VERSION"
if [ "${1:-}" = "--diagnose" ]; then
  echo "开发工具检测完成，尚未编译、截图或申请录屏权限。"
  exit 0
fi

mkdir -p .build
judge_toolchain_stamp=$(printf '%s\n' "$JUDGE_SELECTED_DEVELOPER" "$JUDGE_SELECTED_SWIFT" "$JUDGE_SELECTED_SDK" "$JUDGE_SELECTED_SDK_VERSION")
if [ ! -x .build/NotificationProbe ] || [ NotificationProbe.swift -nt .build/NotificationProbe ] || \
  [ ! -f .build/toolchain.txt ] || [ "$(cat .build/toolchain.txt)" != "$judge_toolchain_stamp" ]; then
  echo "正在本机编译识别工具（首次需要片刻）…"
  if ! /usr/bin/env -u TOOLCHAINS DEVELOPER_DIR="$JUDGE_SELECTED_DEVELOPER" SDKROOT="$JUDGE_SELECTED_SDK" \
    "$JUDGE_SELECTED_SWIFT" -sdk "$JUDGE_SELECTED_SDK" -swift-version 5 -parse-as-library -O \
    -module-cache-path .build/module-cache NotificationProbe.swift -o .build/NotificationProbe; then
    echo "本机编译未通过。请反馈编译错误，不必反馈通知内容。"
    exit 2
  fi
  printf '%s\n' "$judge_toolchain_stamp" > .build/toolchain.txt
fi

if ! .build/NotificationProbe --permission-only; then
  echo "按上方说明授权并重新打开后，再运行验证。"
  exit 3
fi

echo
echo "请准备一条虚构的飞书测试通知，例如：测试同事／请今天16点前交测试稿，收到请回复。"
echo "通知中需要能看见姓名和正文。默认区域为主屏幕右上角 480×360 点。"
echo "按回车后有10秒可展开通知中心，让这条通知保持可见。"
read -r -p "准备好后按回车开始…" _judge_probe_ready
.build/NotificationProbe --delay=10
