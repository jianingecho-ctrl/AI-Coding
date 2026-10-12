# 职场小判官

Electron + React + TypeScript 的 macOS 桌面宠物 MVP。原创 CSS 卡通打工人，透明、无边框、置顶窗口，可通过人物区域或顶部拖动区移动。所有业务界面为中文。

## 第一版功能

- 待机时循环摸鱼、打哈欠和呼吸动作。
- 联系人分为领导、喜欢的同事、普通同事、讨厌的人；分别立正、开心、招手、滑跪。
- 讨厌的人发消息时，桌宠移动到当前屏幕右边缘，滑跪进场、跪地举牌，保持摘要卡片与跪姿。
- 卡片展示核心内容、待办事项、截止时间、回复要求。可查看原文、继续跪着、关闭；下一条消息替换当前卡片，之前消息仍在历史中。
- 控制台管理联系人、模拟飞书消息、查询/清空历史、配置昵称与工服颜色。关闭控制台后桌宠继续运行，可从桌宠重新打开。
- 本地配置和最近 200 条消息以 JSON 保存；联系人删除不删除历史消息，历史保留发送时的姓名与角色。
- 默认使用离线规则摘要，也可启用本机 Ollama AI。没有真实飞书登录、监听或发送功能，不会给真实联系人发消息。

## 项目结构

```text
electron/
  main.ts             主进程、双窗口、IPC、消息处理
  preload.ts          最小权限桌面接口
  store.ts            校验、串行更新、原子写入、损坏文件备份
  ai.ts               Ollama AI 接口及明确降级
src/
  App.tsx             桌宠与控制台视图
  components/
    Character.tsx     原创 CSS 人物
    MessageCard.tsx    摘要卡片及操作
  lib/
    model.ts          类型与输入校验
    summary.ts        离线规则摘要
  styles.css          布局和动画
tests/
  summary.test.ts      摘要和配置校验
  store.test.ts        本地存储测试
  ai.test.ts           AI 协议、输出校验、降级测试
  desktop.cjs          真实 Electron 双窗口自动验收
```

## 在 macOS 启动

安装 Node.js 22.12 或更新的 LTS 版本（本次使用 Node 24）。在项目根目录执行：

```bash
npm ci
npm run dev
```

会打开桌宠与控制台两个窗口。测试面板默认选中「甩锅达人」，输入模拟消息并点击「发送并触发动画」。拖动人物或顶部「拖动小判官」区域移动桌宠；卡片按钮不属于拖动区。

修改渲染界面时 Vite 自动刷新。修改 `electron/` 或主进程共享逻辑后，请停止并重新运行 `npm run dev`。直接在浏览器访问 Vite 地址不能使用桌面接口。

运行生产构建：

```bash
npm run build
npm start
```

## 可选：真正的本地 AI 摘要

默认离线规则不需要模型或账号，也不声称是 AI。若要用大模型理解消息，请从 [Ollama 官方网站](https://ollama.com/download/mac) 安装 macOS 应用并启动，然后执行：

```bash
ollama pull qwen2.5:3b
```

在「人物设置 → 本地 AI 摘要」勾选启用，模型名保持 `qwen2.5:3b`，保存后发送模拟消息。模型须与本机已安装名称一致；也可用其他支持 Ollama JSON 输出的模型。模型下载需要网络和数 GB 磁盘空间。若只安装了 CLI，可在单独终端运行 `ollama serve`。

应用仅访问 `http://127.0.0.1:11434/api/chat`，不会把消息发到云端；固定本机地址，不接受任意远程服务地址。请求最长 30 秒，非成功响应、连接失败、超时或不符合字段要求的响应均降级为本地规则摘要，卡片明确显示原因。模拟发送期间按钮显示「正在送达…」。

规则摘要仅提取关键词与时间表达，不能可靠理解复杂否定、语义或优先级；AI 也可能误判。截止时间保留原文相对日期，不虚构具体日期。始终保留原消息供核对。实际模型推理未在本次 Linux 云环境执行；AI 接口通过协议模拟及异常测试。

## 测试

```bash
npm run typecheck
npm test
npm run test:desktop
```

桌面测试启动真实 Electron，使用独立临时数据目录，并在结束后清理，不接触日常配置。覆盖四类动作、滑跪举牌、持续跪姿、查看原文、关闭卡片、联系人和人物设置、历史、重启恢复、清空历史、控制台关闭后桌宠继续运行。截图保存在 `test-results/pet.png` 与 `test-results/panel.png`。

在 macOS 的正常图形桌面直接执行。Linux 无图形云环境需要 Xvfb，安装后执行：

```bash
xvfb-run -a npm run test:desktop
```

Playwright Electron 自动化启动器会为测试进程加入 `--no-sandbox`，因此桌面测试仅在隔离环境运行。应用窗口仍声明 `sandbox: true`、上下文隔离、禁用 Node 集成；生产启动不使用 `--no-sandbox`。

本次云机器为无图形桌面的 Linux，已用 Xvfb + Playwright 验证真实 Electron 双窗口。普通 `npm run dev` 的 Electron 启动因云机器缺少可用 Chromium 沙箱而退出；Vite 可正常运行。这是当前 Linux 容器的权限限制，未修改生产脚本关闭沙箱。macOS 实机与 DMG 打包尚待验收。

## 打包 macOS 应用

请在 macOS 上执行（生成 DMG、签名与公证需要 macOS 工具链）：

```bash
npm ci
npm run pack:mac
```

输出目录为 `release/`，包含 Apple Silicon（arm64）和 Intel（x64）的 DMG 与 ZIP，应用名称为「职场小判官」。只打包当前所需架构：

```bash
npm run build
npx electron-builder --mac --arm64
# 或 Intel：npx electron-builder --mac --x64
```

没有开发者证书时生成的是本地测试包。分发给其他用户前，应通过 electron-builder 配置 Apple Developer 证书签名和公证，并配置自有图标；当前包使用 Electron 默认应用图标。凭据通过构建环境安全注入，不写入仓库。构建文档：[electron-builder macOS](https://www.electron.build/mac.html)。本次未在 macOS 构建 DMG，也未验证 macOS 多桌面、全屏、Retina 与签名行为。

## 本地数据

数据文件为 Electron `app.getPath('userData')` 下的 `judge-state.json`，macOS 通常位于：

```text
~/Library/Application Support/职场小判官/judge-state.json
```

开发环境目录可能使用 npm 应用名 `workplace-little-judge`。需要隔离实例或测试时，可以设置 `JUDGE_DATA_DIR` 指向专用目录。数据是本机明文 JSON，不是加密保险库；勿输入敏感真实工作消息。损坏配置会改名为 `.invalid-时间戳` 备份后恢复默认设置。正常写入使用临时文件和原子重命名。

## 已知边界

- 不接入真实飞书，不模拟账号授权。
- 动画为 CSS 骨骼拼合人物；窗口右边缘内的滑入与举牌动画为第一版表现。
- 窗口透明区域仍可能接收鼠标事件；可拖动窗口避开常用区域。本版未加入鼠标穿透与开机自启动。
- 不恢复上次会话的打开卡片；历史与人物配置会恢复。
- AI 为可选本地模型，需要用户安装 Ollama 和模型；没有账号或付费 API 要求。
