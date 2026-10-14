#!/bin/bash
set -eu
cd "$(dirname "$0")"
. ./toolchain.sh
judge_probe_select_toolchain /usr/bin/xcode-select /usr/bin/xcrun \
  /Library/Developer/CommandLineTools /Applications/Xcode.app/Contents/Developer /Applications/Xcode-beta.app/Contents/Developer
mkdir -p bin .build
architectures=("${1:-arm64}")
if [ "${1:-}" = "all" ]; then architectures=(arm64 x64); fi
for architecture in "${architectures[@]}"; do
  target="$architecture"
  if [ "$architecture" = x64 ]; then target=x86_64; fi
  /usr/bin/env -u TOOLCHAINS DEVELOPER_DIR="$JUDGE_SELECTED_DEVELOPER" SDKROOT="$JUDGE_SELECTED_SDK" \
    "$JUDGE_SELECTED_SWIFT" -sdk "$JUDGE_SELECTED_SDK" -target "$target-apple-macosx15.2" \
    -swift-version 5 -parse-as-library -O -module-cache-path ".build/modules-$architecture" \
    NotificationCapture.swift -o "bin/NotificationCapture-$architecture.tmp"
  /bin/mv "bin/NotificationCapture-$architecture.tmp" "bin/NotificationCapture-$architecture"
  echo "原生通知识别模块已构建：${architecture}（SDK ${JUDGE_SELECTED_SDK_VERSION}）"
done
