#!/bin/bash
# Bash 3.2 compatible. Resolve tools without changing xcode-select or the shell environment.
judge_probe_xcrun() {
  local developer="$1" xcrun_bin="$2"
  shift 2
  /usr/bin/env -u SDKROOT -u TOOLCHAINS DEVELOPER_DIR="$developer" "$xcrun_bin" "$@"
}

judge_probe_select_toolchain() {
  local select_bin="$1" xcrun_bin="$2"
  shift 2
  local active="" select_error="" developer swift sdk_path sdk_version major minor header
  local candidates=()
  JUDGE_SELECTED_DEVELOPER=""
  JUDGE_SELECTED_SWIFT=""
  JUDGE_SELECTED_SDK=""
  JUDGE_SELECTED_SDK_VERSION=""
  if active=$("$select_bin" -p 2>&1); then
    candidates=("$active" "$@")
  else
    select_error="$active"
    candidates=("$@")
    printf '当前开发工具路径查询失败：\n%s\n' "$select_error"
  fi
  for developer in "${candidates[@]}"; do
    [ -n "$developer" ] || continue
    if [ ! -d "$developer" ]; then
      printf '开发工具目录不存在：%s\n' "$developer"
      continue
    fi
    if ! swift=$(judge_probe_xcrun "$developer" "$xcrun_bin" --find swiftc 2>&1); then
      printf '此目录的 Swift 查询失败：%s\n%s\n' "$developer" "$swift"
      continue
    fi
    if [ ! -x "$swift" ]; then
      printf 'Swift 路径不可执行：%s\n' "$swift"
      continue
    fi
    if ! sdk_path=$(judge_probe_xcrun "$developer" "$xcrun_bin" --sdk macosx --show-sdk-path 2>&1); then
      printf '此目录的 macOS SDK 查询失败：%s\n%s\n' "$developer" "$sdk_path"
      continue
    fi
    if [ ! -d "$sdk_path" ]; then
      printf 'macOS SDK 目录不存在：%s\n' "$sdk_path"
      continue
    fi
    if ! sdk_version=$(judge_probe_xcrun "$developer" "$xcrun_bin" --sdk macosx --show-sdk-version 2>&1); then
      printf 'macOS SDK 版本查询失败：\n%s\n' "$sdk_version"
      continue
    fi
    if [[ "$sdk_version" =~ ^([0-9]+)(\.([0-9]+))? ]]; then
      major="${BASH_REMATCH[1]}"
      minor="${BASH_REMATCH[3]:-0}"
    else
      printf '无法解析 macOS SDK 版本：%s\n' "$sdk_version"
      continue
    fi
    if [ "$major" -lt 15 ] || { [ "$major" -eq 15 ] && [ "$minor" -lt 2 ]; }; then
      printf '此目录的 SDK %s 过旧，需要 15.2 或更新版本：%s\n' "$sdk_version" "$developer"
      continue
    fi
    header="$sdk_path/System/Library/Frameworks/ScreenCaptureKit.framework/Headers/SCScreenshotManager.h"
    if [ ! -f "$header" ]; then
      printf 'SDK 缺少 ScreenCaptureKit 截图接口头文件：%s\n' "$sdk_path"
      continue
    fi
    JUDGE_SELECTED_DEVELOPER="$developer"
    JUDGE_SELECTED_SWIFT="$swift"
    JUDGE_SELECTED_SDK="$sdk_path"
    JUDGE_SELECTED_SDK_VERSION="$sdk_version"
    return 0
  done
  echo "没有找到可用的 Swift + macOS SDK 组合。以上是系统返回的具体原因。"
  echo "已安装开发工具时，请查看系统设置 → 通用 → 软件更新中的 Command Line Tools 更新。"
  echo "若安装了 Xcode，请确认已打开它完成首次初始化。此脚本不会删除工具或改变全局开发工具选择。"
  return 2
}
