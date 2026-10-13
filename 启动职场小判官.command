#!/bin/bash
set -e
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "请先安装 Node.js 24 LTS：https://nodejs.org/"
  read -r -p "按回车关闭窗口…" _judge_wait
  exit 1
fi
trap 'echo "启动中断，请查看上方错误。操作教程在 docs/Mac使用教程.md。"; read -r -p "按回车关闭窗口…" _judge_wait' ERR
if [ ! -f node_modules/.judge-lock.json ] || ! cmp -s package-lock.json node_modules/.judge-lock.json; then
  ELECTRON_MIRROR="${ELECTRON_MIRROR:-https://npmmirror.com/mirrors/electron/}" npm ci
  cp package-lock.json node_modules/.judge-lock.json
fi
npm run build
npm start -- "$@"
