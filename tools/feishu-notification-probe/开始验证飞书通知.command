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

echo "飞书桌面通知识别验证 · 0.1.0"
echo "仅使用公开的区域截图与本机文字识别，不联网，不保存截图，不接入飞书账号。"
echo "这一步验证可见通知是否能被识别，暂不触发桌宠。"
echo

if ! /usr/bin/xcode-select -p >/dev/null 2>&1; then
  echo "首次编译需要 Apple 命令行开发工具。请在终端执行："
  echo "xcode-select --install"
  echo "完成系统安装后，再双击这个验证脚本。"
  exit 2
fi

if ! /usr/bin/xcrun --sdk macosx --find swiftc >/dev/null 2>&1; then
  echo "没有找到 Swift 编译器。请安装或更新 Apple 命令行开发工具后重试。"
  exit 2
fi

sdk=$(/usr/bin/xcrun --sdk macosx --show-sdk-version)
sdk_major=${sdk%%.*}
sdk_tail=${sdk#*.}
sdk_minor=${sdk_tail%%.*}
if [ "$sdk_major" -lt 15 ] || { [ "$sdk_major" -eq 15 ] && [ "$sdk_minor" -lt 2 ]; }; then
  echo "当前开发 SDK 是 $sdk，编译区域截图接口需要 15.2 或更新 SDK。"
  echo "请从系统的软件更新安装新版命令行开发工具；macOS 版本新不代表开发工具已更新。"
  exit 2
fi

mkdir -p .build
if [ ! -x .build/NotificationProbe ] || [ NotificationProbe.swift -nt .build/NotificationProbe ]; then
  echo "正在本机编译识别工具（首次需要片刻）…"
  if ! /usr/bin/xcrun --sdk macosx swiftc -swift-version 5 -parse-as-library -O -module-cache-path .build/module-cache NotificationProbe.swift -o .build/NotificationProbe; then
    echo "本机编译未通过。请反馈编译错误，不必反馈通知内容。"
    exit 2
  fi
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
