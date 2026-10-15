# 职场小判官 · 0.12.1 双主题版 / Windows 体验版

使用 Electron + React + TypeScript 的桌面趣味消息助手。一个应用内置比奇堡、甄嬛传两套风格，在测试面板切换。六个板块和桌面人物一起切换，联系人、消息历史、回复、互动次数、素材、音乐、AI 配置及密钥分档保存。

Windows 10/11 x64 用户：[下载 EXE 安装包](https://github.com/jianingecho-ctrl/AI-Coding/releases/download/windows-v0.12.1/WorkJudge-Setup-0.12.1-x64.exe)，双击中文向导安装，无需开发工具。详见 [Windows 安装教程](docs/Windows安装使用教程.md)。这是未签名的体验版，真实 Windows 安装、窗口及通知 OCR 尚需本机验收，通知页面明确标为实验功能。

Mac 已有的 [0.11.0 双主题源码 ZIP](https://github.com/jianingecho-ctrl/AI-Coding/archive/refs/tags/unified-v0.11.0.zip)仍可使用。分享源码包给 Mac 同事的完整步骤见 [转发教程](docs/把Mac源码包分享给同事.md)。解压后双击「启动双主题版.command」，或在文件夹内执行：

```bash
npm ci
npm run build
npm start
```

源码 ZIP 需要在 Mac 安装依赖、构建，未提供已签名、公证的 Mac 安装包。详见 [Mac 启动教程](docs/Mac使用教程.md)。

## 这版的改动

- 新增 Windows x64 中文安装器、桌面/开始菜单入口和卸载入口，保留用户数据。打包只带对应平台的通知模块。
- Windows 通知适配使用系统 PowerShell、可见区域截图与 Windows.Media.Ocr，默认主屏幕右下角。需要中文 OCR 语言组件，来源不明时需人工确认，不修改系统或企业执行策略。Windows OCR 没有评分，界面如实标注。
- Windows 桌宠初始放在左下角，避开默认通知选区；Mac 保留原来的位置与原生 Swift 通知模块。
- 在测试面板选择比奇堡或甄嬛传，控制台、人物、飞书通知、联系人、消息历史、互动统计和人物设置同步切换。自动恢复上次选择。
- 两套资料分别保存。切换暂停通知识别，清除草稿、当前卡片及展示队列，并停止音效。异步分析只保存在原档案，不弹入另一套。
- 首次使用某个档案时复制原独立版有效配置、素材及音乐，保留原目录，不持续同步。迁移后关闭 AI，密钥需重新配置。
- 消息正文默认展开；摘要、待办和解析说明可展开。六个互动按钮压成一行，计数默认折叠，正文空间增大，长消息可滚动、选择复制。
- 掌嘴声强调短促、高频的「啪」；飞踢播放内置原创合成短句「走你」，人物飞出再回来。离线播放，不调用系统语音或网络服务。

## 已有功能

透明、无边框、可拖动和置顶桌宠，默认 60% 尺寸，可调整、隐藏或退出。七类人物保持轻微待机晃动，使用跑入、走入、飘入、翻滚、蹦跳、右侧滑入、淡入区分进场。

每个联系人独立配置本主题人物、进场、皮肤、卡片、时长、特效、台词和消息优先级。PNG/JPG/WebP、GIF、多图序列帧可上传并实际显示。模拟消息、预览和七人演示不依赖飞书账号。

可见飞书通知使用本机区域截图和中文文字识别。识别一次或开始监测，可将明确匹配到联系人的当前通知自动送达。来源、姓名或正文不明确时人工确认。只能读取屏幕展示的内容，隐藏、截断、被遮挡的消息无法补全。详见 [通知教程](docs/飞书通知使用教程.md)。

已送达通知按联系人优先级展示，高优先级可先出场，原卡片回到队列。同级先到先展示，回复及互动时暂停插队，关闭当前卡片展示下一条。重启后监测暂停，展示队列不持久化，消息历史保留最近 200 条。

肘击、扇嘴、烧心、比心、嫁给ta、飞踢ta都有对应效果和音效；今日次数按本机日期统计、重启保留，最近 90 天可查看汇总。趣味互动不向同事发送内容。

婚礼音乐可导入本地 MP3/WAV/M4A/OGG，最大 15 MB，只播放开头最多 10 秒并淡出。未导入时明确使用原创钟声，未内置《今天你要嫁给我》商业录音。各主题音乐独立，删除副本不影响原文件。

消息卡片支持正文、结构化摘要、待办、截止时间、紧急程度、回复要求和原始识别内容。回复仅保存在本地，可复制到飞书手动发送。

## 隐私和数据

截图及未送达草稿只存内存，不上传。真实通知始终本机规则解析，不调用外部 AI。模拟消息可选本机 Ollama 或 OpenAI 兼容服务，默认关闭；在线 AI 的传输范围在界面说明，失败明确降级。

双主题数据在：

```text
~/Library/Application Support/workplace-little-judge-unified/
├── active-profile.json       上次选择的主题
├── profiles/ocean/           比奇堡联系人、历史、统计、素材、音乐及密钥
├── profiles/palace/          甄嬛传联系人、历史、统计、素材、音乐及密钥
└── session/                  应用会话
```

备份前退出应用，再复制整个目录。清空某个主题的历史、统计或音乐不会清除另一主题。

Windows 的对应数据根目录为 `%APPDATA%\workplace-little-judge-unified`，主题仍分别保存在 `profiles\ocean`、`profiles\palace`。安装包不会包含你的个人配置和历史。

## 开发与验证

```bash
npm ci
npm run typecheck
npm test
npm run build
npm start
```

桌面验收需要图形环境，Linux 可使用 Xvfb：

```bash
npm run test:unified
npm run test:priority
npm run test:notifications
```

`node tests/unified-races-desktop.cjs` 验证切换期间旧分析、文件选择及声音不会串入新档案。通知测试使用虚构 OCR 夹具，未读取真实屏幕；云端无法编译 macOS 模块或听取 Mac 扬声器，需要本机验收。

Mac 打包：

```bash
npm run pack:mac
```

结果在 release/unified/，包含 arm64/x64 原生识别模块和两套人物。未在云端生成或验证已签名、公证的 DMG。

Windows 打包：

```bash
npm run pack:win
```

结果为 `release/unified/WorkJudge-Setup-0.12.1-x64.exe`。云端可构建并检查 NSIS 内容；不能代替真实 Windows 安装、系统截图、OCR 和声音验收。Windows 脚本的语法及内嵌 C# 可在 PowerShell 解析器中检查，Windows API 仍须本机执行。

## 目录

```text
src/App.tsx                     主题选择及六板块
src/components/MessageCard.tsx  正文、摘要、回复和紧凑互动
src/lib/profile-context.ts     主题范围与人物素材缓存隔离
src/lib/interaction-audio.ts   音量、静音、音乐前奏和走你语音
src/assets/sounds/             内置语音素材
electron/main.ts               窗口、切换与 IPC
electron/profiles.ts           独立档案与旧版复制
electron/notifications.ts      本机通知接入与去重
electron/message-queue.ts      联系人优先级队列
native/NotificationCapture.swift  区域截图及本机识别
native/windows/NotificationCapture.ps1  Windows 可见选区及系统 OCR（实验）
build/windows-installer.nsi     Windows 中文安装及安全卸载
scripts/windows-after-pack.cjs  只删除已交付文件的卸载清单
scripts/export-editions.mjs    导出统一源码目录
```

内置「走你」由 eSpeak NG 根据固定短句离线合成，生成脚本为 scripts/render-kick-voice.py；仅重新生成素材时需要 Python 与 espeakng-loader==0.2.4，应用运行不需要它们。
