# 飞书桌面通知识别验证 · 0.1.1

用于先验证 Mac 上可见的飞书通知能否被截图和文字识别。适用 macOS 15.2 或更新版本，包含你提供的 macOS 26.6。系统版本符合接口要求，不代表通知实际一定能捕获。

这是独立验证工具，**尚未接入 0.8.0 小判官，不自动监听、不触发人物、不回复飞书**。通知 SDK 的应用自身通知接口不能作为个人飞书全部消息入口。

## 操作

1. macOS 系统设置 → 通知 → 飞书，允许通知，开启可见的消息预览。飞书客户端也需开启桌面通知及内容预览；具体开关名称随飞书版本变化。
2. 使用没有公司内容的测试消息。先确认通知中能看到发信人和正文，必要时展开通知中心。不要用真实公司信息测试或把真实通知日志发回聊天。
3. 双击「开始验证飞书通知.command」。只需要这个工具，不需要打开小判官或安装 Node。
4. 如果提示缺少 Apple 命令行工具，在终端执行 `xcode-select --install`，完成系统安装后重新双击脚本。系统 SDK 也需 15.2 或更新版本。
5. 允许系统要求的屏幕录制权限。从脚本启动时通常给「终端（Terminal）」授权；按系统提示退出并重新打开。无需麦克风、系统音频或辅助功能权限。
6. 按回车后有 10 秒可展开测试通知。默认只读取主屏幕右上角 480×360 点，截取一次。
7. 返回终端，核对识别出来的姓名和正文。只需反馈是否完整正确、是否没有文字，或者工具的编译/授权报错。

如果录屏期间系统不展示通知，检查「通知」中关于镜像或共享显示器时允许通知的选项，以及飞书勿扰设置；不同版本名称可能不同。这个选项是否影响区域截图，仍需本机实际验证。如果通知只写「收到一条消息」、已被系统隐藏或正文有省略号，工具无法补全正文。

脚本打不开时，在终端输入 `cd `，拖入解压文件夹，按回车，然后执行：

```bash
bash ./开始验证飞书通知.command
```

## 已安装开发工具，但找不到 Swift

0.1.1 分别检测 Swift 与 SDK，显示 `xcrun` 的实际错误。仅为本次进程检查当前路径、Command Line Tools 和标准 Xcode 路径，选取具备可执行编译器及 15.2+ SDK 的组合。查询不会使用继承的 SDKROOT/TOOLCHAINS 覆盖值；编译显式使用所选 SDK，不改变全局 `xcode-select`，不删除任何开发工具。

在终端进入解压后的 0.1.1 文件夹执行以下诊断，不会编译、截图或申请录屏权限：

```bash
bash ./开始验证飞书通知.command --diagnose
```

如果所有候选目录都无效，按具体输出处理：目录不存在或编译器缺失需安装/修复开发工具；SDK 太旧需通过系统的软件更新升级 Command Line Tools，或初始化新版 Xcode。`xcode-select --install` 提示已安装时，重复执行不会完成更新。请把诊断输出发回，不要删除开发工具目录。

看到「按回车关闭窗口…」时，只按一次回车。出现终端的 `$` 后再输入下一条命令，否则输入会被脚本的等待提示接收。

## 区域与诊断

默认区域读不到通知或使用外接显示器时，可调整区域，坐标单位为屏幕点，主屏幕左上角是 (0,0)。最多允许宽 800、高 1000 点：

```bash
./.build/NotificationProbe --rect 900 0 480 500 --delay=10
```

以上坐标只是示例，要按你的显示器和通知位置调整。`--json` 输出结构化的本机识别结果，`--permission-only` 仅检查授权，不截图。

图像仅在内存中经过 ScreenCaptureKit 与 Apple Vision，不落盘、不联网。区域中出现其他应用的文字也可能被 OCR 识别，所以结果不能直接当作已验证的飞书消息；本工具没有自动判定发信人或自动写入历史。

## 验证后怎样接入

先确认本机能捕获通知且中文可读，再实现小判官的通知来源入口：限定区域 → 本地 OCR → 验证通知来源 → 识别发送人和正文 → 匹配联系人（同名或不确定时人工确认）→ 去重 → 规则摘要 → 本版人物和互动。

正式接入需有开始/暂停、识别预览、明确来源标签、漏识别说明；只有确认是飞书通知的内容才允许自动触发。真实通知默认在本机处理，外部 AI 默认关闭。截图不应存入消息历史，摘要不能虚构被截断的原文。模拟回复仍只保存在本地，实际发送需另行设计获授权的接入。

## 验证范围与资料

云端 Linux 已检查启动脚本语法、拒绝非 Mac 平台的行为和交付包内容；使用工具路径与 SDK 仿真验证环境覆盖、无效路径、SDK 缺失/过旧、Xcode 回退和错误保留。仿真仅验证路径选择，不代替 macOS 编译。云端没有 Swift/macOS 框架，**未执行本机编译、截图、权限弹窗或中文 OCR**；成功必须以你的 Mac 输出为准。

公开 API：ScreenCaptureKit 的 `SCScreenshotManager.captureImage(in:completionHandler:)`（macOS 15.2 起）和 Vision 的 `VNRecognizeTextRequest`。已对照公开 SDK 头文件核实区域坐标、Swift 方法名与中文支持；Apple 文档站本次云端访问受限。

- [Apple ScreenCaptureKit 文档](https://developer.apple.com/documentation/screencapturekit/scscreenshotmanager)
- [Apple Vision 文档](https://developer.apple.com/documentation/vision/vnrecognizetextrequest)
- [区域截图 SDK 头文件镜像](https://github.com/alexey-lysiuk/macos-sdk/blob/master/MacOSX15.5.sdk/System/Library/Frameworks/ScreenCaptureKit.framework/Versions/A/Headers/SCScreenshotManager.h)
- [Apple Vision SDK 头文件镜像](https://github.com/phracker/MacOSX-SDKs/blob/master/MacOSX11.3.sdk/System/Library/Frameworks/Vision.framework/Versions/A/Headers/VNRecognizeTextRequest.h)
