import Foundation
import CoreGraphics
import AppKit
@preconcurrency import ScreenCaptureKit
@preconcurrency import Vision
import Darwin

// 只调用公开的区域截图与本机 OCR；不读取飞书数据库或通知数据库。
// 图片只在内存中处理，不写入文件，不联网，不自动发送消息。
struct ProbeFailure: Error { let message: String }

struct VisibleContext {
    let kind: String
    let windowID: UInt32?
    let focus: CGRect?
}
@MainActor
func contextForRegion(_ region: CGRect) -> VisibleContext {
    guard let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] else { return VisibleContext(kind: "unknown", windowID: nil, focus: nil) }
    for window in windows {
        guard let bounds = window[kCGWindowBounds as String] as? [String: Any],
              let frame = CGRect(dictionaryRepresentation: bounds as CFDictionary) else { continue }
        let intersection = region.intersection(frame)
        guard !intersection.isNull, intersection.height >= 40, intersection.width * intersection.height >= 5000 else { continue }
        let owner = window[kCGWindowOwnerName as String] as? String ?? ""
        let id = (window[kCGWindowNumber as String] as? NSNumber)?.uint32Value
        // 系统的飞书应用标题可能在卡片窗体上方；保留至多 64 点顶部区域，仍不越出用户选区。
        let top = max(region.minY, intersection.minY - 64)
        let focus = frame.width >= 150 && frame.width <= 800 && frame.height <= 1000 && intersection.width >= 100 ? CGRect(x: intersection.minX, y: top, width: intersection.width, height: intersection.maxY - top) : nil
        if ["NotificationCenter", "Notification Center", "通知中心"].contains(owner) { return VisibleContext(kind: "system-notification", windowID: id, focus: focus) }
        if let pid = (window[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value,
           let bundle = NSRunningApplication(processIdentifier: pid)?.bundleIdentifier,
           ["com.bytedance.lark", "com.electron.lark"].contains(bundle), frame.width <= 800, frame.height <= 360 { return VisibleContext(kind: "feishu-window", windowID: id, focus: focus) }
        return VisibleContext(kind: "other-window", windowID: id, focus: nil)
    }
    return VisibleContext(kind: "unknown", windowID: nil, focus: nil)
}

@available(macOS 15.2, *)
func capture(_ rect: CGRect) async throws -> CGImage {
    try await withCheckedThrowingContinuation { continuation in
        SCScreenshotManager.captureImage(in: rect) { image, error in
            if let error = error { continuation.resume(throwing: error) }
            else if let image = image { continuation.resume(returning: image) }
            else { continuation.resume(throwing: ProbeFailure(message: "没有获得区域图像。")) }
        }
    }
}

func report(_ data: [String: Any], json: Bool) {
    if json, let bytes = try? JSONSerialization.data(withJSONObject: data, options: [.sortedKeys]),
       let text = String(data: bytes, encoding: .utf8) { print(text); return }
    print(data["message"] as? String ?? "验证结束。")
    if let rect = data["region"] as? [String: Double] {
        print("识别区域：x=\(Int(rect["x"]!))，y=\(Int(rect["y"]!))，宽=\(Int(rect["width"]!))，高=\(Int(rect["height"]!))（屏幕点）。")
    }
    if let lines = data["lines"] as? [[String: Any]] {
        for (i, line) in lines.enumerated() { print("\(i + 1). \(line["text"] as? String ?? "")") }
    }
    if let tip = data["tip"] as? String { print(tip) }
}

@main
struct NotificationCapture {
    static func main() async {
        let args = Array(CommandLine.arguments.dropFirst()), json = args.contains("--json")
        if args.contains("--help") {
            print("飞书可见通知识别：默认截取主屏幕右上角 480×360 点。")
            print("--delay=10：等待 10 秒再截图（范围 0–30）。")
            print("--rect x y width height：指定屏幕区域，单位为点，原点为主屏幕左上角。")
            print("--permission-only：只检查和请求录屏权限。--json：输出本机 JSON 结果。")
            return
        }
        guard #available(macOS 15.2, *) else {
            report(["status": "unsupported", "message": "此验证工具需要 macOS 15.2 或更新版本。"], json: json); exit(2)
        }
        guard CGPreflightScreenCaptureAccess() else {
            _ = CGRequestScreenCaptureAccess()
            report(["status": "permission-required", "message": "尚未获得屏幕录制权限，本次未识别。",
                    "tip": "在系统设置 → 隐私与安全性 → 屏幕与系统音频录制，允许系统提示的当前应用（桌宠源码运行通常为 Electron）。按系统提示退出并重新打开，再运行验证。无需麦克风或辅助功能权限。"], json: json)
            exit(3)
        }
        if args.contains("--permission-only") {
            report(["status": "permission-ready", "message": "屏幕录制权限可用，尚未截取图像。"], json: json); return
        }
        do {
            let display = CGDisplayBounds(CGMainDisplayID())
            var rect = CGRect(x: display.maxX - min(480, display.width), y: display.minY,
                              width: min(480, display.width), height: min(360, display.height))
            if let index = args.firstIndex(of: "--size") {
                guard args.count >= index + 3, let width = Double(args[index + 1]), let height = Double(args[index + 2]),
                      width.isFinite, height.isFinite, (50...800).contains(width), (50...1000).contains(height) else { throw ProbeFailure(message: "选区宽高无效。") }
                rect = CGRect(x: display.maxX - min(CGFloat(width), display.width), y: display.minY,
                              width: min(CGFloat(width), display.width), height: min(CGFloat(height), display.height))
            }
            if let index = args.firstIndex(of: "--rect") {
                guard args.count >= index + 5 else { throw ProbeFailure(message: "区域参数需要 x、y、宽、高四个数字。") }
                let values = args[(index + 1)...(index + 4)].compactMap(Double.init)
                guard values.count == 4, values.allSatisfy({ $0.isFinite }), values[2] >= 50, values[3] >= 50,
                      values[2] <= 800, values[3] <= 1000 else { throw ProbeFailure(message: "区域无效：宽高须为 50–800、50–1000 点。") }
                rect = CGRect(x: values[0], y: values[1], width: values[2], height: values[3])
            }
            var delay = 10.0
            var contactHints: [String] = []
            if args.contains("--contact-hints") {
                let data = FileHandle.standardInput.readDataToEndOfFile()
                guard data.count <= 20000, let names = try? JSONDecoder().decode([String].self, from: data), names.count <= 128,
                      names.allSatisfy({ !$0.isEmpty && $0.count <= 40 }) else { throw ProbeFailure(message: "联系人识别提示无效。") }
                contactHints = names
            }
            if let option = args.first(where: { $0.hasPrefix("--delay=") }) {
                guard let seconds = Double(option.dropFirst(8)), seconds.isFinite, (0...30).contains(seconds)
                else { throw ProbeFailure(message: "等待时间须为 0–30 秒。") }
                delay = seconds
            }
            if !json {
                print("将在 \(Int(delay)) 秒后识别指定区域。现在可展开通知中心，让虚构的飞书测试通知保持可见。")
                fflush(stdout)
            }
            try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            // 超时退出，避免系统截图回调未返回时一直等待。
            DispatchQueue.global().asyncAfter(deadline: .now() + 20) {
                report(["status": "timeout", "message": "区域截图或文字识别超时，未获得结果。"], json: json); exit(4)
            }
            let before = await contextForRegion(rect)
            // 只能收窄到用户选区内最前面的通知窗口，不读取选区外或被覆盖的聊天。
            let captureRect = before.focus ?? rect
            let image = try await capture(captureRect)
            let after = await contextForRegion(captureRect)
            let context = before.kind == after.kind && before.windowID == after.windowID ? before.kind : "unknown"
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.customWords = contactHints
            request.minimumTextHeight = 0.01
            let supported = try request.supportedRecognitionLanguages()
            guard let chinese = supported.first(where: { $0 == "zh-Hans" || $0.hasPrefix("zh-Hans-") })
            else { throw ProbeFailure(message: "本机识别服务未提供简体中文，本次不能验证中文通知。") }
            request.recognitionLanguages = [chinese] + Array(supported.filter({ $0 == "en-US" }).prefix(1))
            try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
            let observations = (request.results ?? []).sorted {
                let firstRow = Int(($0.boundingBox.midY * 100).rounded())
                let secondRow = Int(($1.boundingBox.midY * 100).rounded())
                if firstRow != secondRow { return firstRow > secondRow }
                return $0.boundingBox.minX < $1.boundingBox.minX
            }
            let lines: [[String: Any]] = observations.prefix(100).compactMap { observation in
                guard let candidate = observation.topCandidates(1).first else { return nil }
                let box = observation.boundingBox
                // 转换为截图左上角原点的点坐标，以区分通知正文与旁边的文件名。
                return ["text": candidate.string, "confidence": Double(candidate.confidence),
                        "box": ["x": Double(box.minX * captureRect.width), "y": Double((1 - box.maxY) * captureRect.height),
                                "width": Double(box.width * captureRect.width), "height": Double(box.height * captureRect.height)]]
            }
            let region = ["x": Double(captureRect.minX), "y": Double(captureRect.minY), "width": Double(captureRect.width), "height": Double(captureRect.height)]
            report(["status": lines.isEmpty ? "no-text" : "recognized", "region": region, "lines": lines, "context": context,
                    "captureMode": before.focus == nil ? "selected-area" : "notification-window",
                    "message": lines.isEmpty ? "没有识别到文字；这不代表没有收到消息。" : "识别到 \(lines.count) 段可见文字：",
                    "tip": "请对照测试通知核对发送人和正文。结果仅为所选区域的 OCR，不证明内容一定来自飞书，不恢复隐藏或截断的内容，发送人匹配和送达由小判官控制台完成。"], json: json)
        } catch {
            report(["status": "failed", "message": (error as? ProbeFailure)?.message ?? "区域截图或文字识别失败：\(error.localizedDescription)"], json: json)
            exit(5)
        }
    }
}
