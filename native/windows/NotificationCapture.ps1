# Public visible-region capture + Windows.Media.Ocr. No account/database access.
param([int]$DelaySeconds = 0, [switch]$Check)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
$bitmap = $null; $memory = $null; $graphics = $null; $random = $null; $writer = $null; $software = $null
function Write-Frame($value) { [Console]::Out.WriteLine(($value | ConvertTo-Json -Depth 8 -Compress)) }
try {
    if ($DelaySeconds -lt 0 -or $DelaySeconds -gt 10) { throw '识别准备时间应为 0-10 秒。' }
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
    $null = [Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType=WindowsRuntime]
    $null = [Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime]
    $null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
    $null = [Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
    $null = [Windows.Graphics.Imaging.BitmapAlphaMode, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
    $null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
    $null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
    $null = [Windows.Storage.Streams.DataWriter, Windows.Storage.Streams, ContentType=WindowsRuntime]
    $language = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | Where-Object {$_.LanguageTag -like 'zh-Hans*' -or $_.LanguageTag -like 'zh-CN*'} | Select-Object -First 1
    $engine = $null
    if ($null -ne $language) { $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language) }
    if ($null -eq $engine) {
        Write-Frame @{status='unsupported';message='系统尚无中文 OCR 组件。请在 Windows 设置 → 时间和语言 → 语言和区域，添加中文（简体，中国）并安装基本输入/光学字符识别组件，再重启应用。模拟消息仍可使用。';lines=@();context='unknown'}
        exit 0
    }
    if ($Check) { Write-Frame @{status='no-text';message='中文 OCR 组件可用。';lines=@();context='unknown'}; exit 0 }
    $captureRequest = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if ($null -eq $captureRequest.region) { throw '没有收到识别区域。' }
    $region = $captureRequest.region
    if ($region.width -lt 50 -or $region.width -gt 800 -or $region.height -lt 50 -or $region.height -gt 1000 -or [Math]::Abs($region.x) -gt 20000 -or [Math]::Abs($region.y) -gt 20000) { throw '识别区域超出允许范围。' }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;
public static class JudgeVisibleWindows {
    [StructLayout(LayoutKind.Sequential)] public struct Rect {public int Left,Top,Right,Bottom;}
    public class Candidate {public long ID;public string Kind="unknown";public Rect Bounds;}
    private delegate bool EnumProc(IntPtr window,IntPtr unused);
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumProc callback,IntPtr unused);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr window,out Rect rect);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr window,out uint processId);
    [DllImport("user32.dll")] public static extern uint GetDpiForSystem();
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
    public static Candidate Find(Rect region,double scale) {
        Candidate result=new Candidate();
        EnumWindows(delegate(IntPtr window,IntPtr unused) {
            Rect rect; if(!IsWindowVisible(window)||!GetWindowRect(window,out rect))return true;
            int width=Math.Min(rect.Right,region.Right)-Math.Max(rect.Left,region.Left);
            int height=Math.Min(rect.Bottom,region.Bottom)-Math.Max(rect.Top,region.Top);
            if(width<=0||height<=0||(long)width*height<5000*scale*scale)return true;
            uint processId; GetWindowThreadProcessId(window,out processId);
            string name; try {name=Process.GetProcessById((int)processId).ProcessName.ToLowerInvariant();} catch {return true;}
            result.ID=window.ToInt64();result.Bounds=rect;result.Kind="other-window";
            // Require a popup-sized public window, not a full desktop shell surface.
            bool popup=rect.Right-rect.Left>=150*scale&&rect.Right-rect.Left<=800*scale&&rect.Bottom-rect.Top>=40*scale&&rect.Bottom-rect.Top<=1000*scale;
            if(popup&&(name=="shellexperiencehost"||name=="shellhost"))result.Kind="system-notification";
            if(popup&&(name=="feishu"||name=="lark"||name=="feishuapp"||name=="larkapp"))result.Kind="feishu-window";
            return false;
        },IntPtr.Zero);
        return result;
    }
}
'@
    [void][JudgeVisibleWindows]::SetThreadDpiAwarenessContext([IntPtr](-4))
    $scale = [Math]::Max(1.0, [JudgeVisibleWindows]::GetDpiForSystem()/96.0)
    $area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    $width = [int][Math]::Round($region.width*$scale); $height = [int][Math]::Round($region.height*$scale)
    if ($region.mode -eq 'primary') { $left=$area.Right-$width; $top=$area.Bottom-$height }
    elseif ($region.mode -eq 'custom') { $left=[int][Math]::Round($region.x*$scale); $top=[int][Math]::Round($region.y*$scale) }
    else { throw '不支持的识别区域模式。' }
    $virtual = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $selected = [System.Drawing.Rectangle]::Intersect([System.Drawing.Rectangle]::new($left,$top,$width,$height),$virtual)
    if ($selected.Width -lt 50 -or $selected.Height -lt 50) { throw '识别区域不在可见显示器范围内。' }
    if ($DelaySeconds) { Start-Sleep -Seconds $DelaySeconds }
    $nativeRect=New-Object JudgeVisibleWindows+Rect
    $nativeRect.Left=$selected.Left; $nativeRect.Top=$selected.Top; $nativeRect.Right=$selected.Right; $nativeRect.Bottom=$selected.Bottom
    $before=[JudgeVisibleWindows]::Find($nativeRect,$scale)
    $captureMode='selected-area'
    if ($before.Kind -eq 'system-notification' -or $before.Kind -eq 'feishu-window') {
        $bounds=$before.Bounds
        $focus=[System.Drawing.Rectangle]::FromLTRB($bounds.Left,$bounds.Top,$bounds.Right,$bounds.Bottom)
        $selected=[System.Drawing.Rectangle]::Intersect($selected,$focus)
        $captureMode='notification-window'
    }
    $bitmap=New-Object System.Drawing.Bitmap($selected.Width,$selected.Height,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($selected.Location,[System.Drawing.Point]::Empty,$selected.Size)
    $graphics.Dispose();$graphics=$null
    $after=[JudgeVisibleWindows]::Find($nativeRect,$scale)
    $context='unknown'
    if ($before.ID -eq $after.ID -and $before.Kind -eq $after.Kind -and
        $before.Bounds.Left -eq $after.Bounds.Left -and $before.Bounds.Top -eq $after.Bounds.Top -and
        $before.Bounds.Right -eq $after.Bounds.Right -and $before.Bounds.Bottom -eq $after.Bounds.Bottom) { $context=$before.Kind }
    $memory=New-Object System.IO.MemoryStream
    $bitmap.Save($memory,[System.Drawing.Imaging.ImageFormat]::Png)
    $bytes=$memory.ToArray()
    $random=[Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $writer=[Windows.Storage.Streams.DataWriter]::new($random)
    $writer.WriteBytes($bytes)
    $asTask=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'} | Select-Object -First 1
    function Wait-WinRT($operation,[Type]$resultType) {
        $task=$asTask.MakeGenericMethod($resultType).Invoke($null,@($operation))
        if (-not $task.Wait(12000)) { throw '本机 OCR 等待超时，请重新识别。' }
        return $task.Result
    }
    $null=Wait-WinRT ($writer.StoreAsync()) ([uint32])
    [void]$writer.DetachStream();$writer.Dispose();$writer=$null
    $random.Seek(0)
    $decoder=Wait-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($random)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $software=Wait-WinRT ($decoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,[Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied)) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $recognized=Wait-WinRT ($engine.RecognizeAsync($software)) ([Windows.Media.Ocr.OcrResult])
    $lines=@()
    foreach ($line in $recognized.Lines) {
        if ($lines.Count -ge 100) { break }
        $x=[double]::PositiveInfinity;$y=[double]::PositiveInfinity;$right=0.0;$bottom=0.0
        foreach ($word in $line.Words) { $box=$word.BoundingRect;$x=[Math]::Min($x,$box.X);$y=[Math]::Min($y,$box.Y);$right=[Math]::Max($right,$box.X+$box.Width);$bottom=[Math]::Max($bottom,$box.Y+$box.Height) }
        if ($right -gt $x -and $bottom -gt $y) {
            # Windows OCR exposes no confidence score. Use a conservative placeholder,
            # never a fabricated high-confidence score; matching uses window + geometry.
            $lines+=@{text=$line.Text.Substring(0,[Math]::Min(1000,$line.Text.Length));confidence=0.5;confidenceKnown=$false;box=@{x=$x/$scale;y=$y/$scale;width=($right-$x)/$scale;height=($bottom-$y)/$scale}}
        }
    }
    $status='recognized';if ($lines.Count -eq 0) { $status='no-text' }
    Write-Frame @{status=$status;message='Windows 可见通知识别为实验功能；系统未提供置信度，请核对姓名、正文和来源。';context=$context;captureMode=$captureMode;lines=@($lines);region=@{x=$selected.X/$scale;y=$selected.Y/$scale;width=$selected.Width/$scale;height=$selected.Height/$scale}}
} catch {
    Write-Frame @{status='failed';message=('Windows 截图或本机识别失败：'+$_.Exception.Message);lines=@();context='unknown'}
} finally {
    foreach ($resource in @($software,$writer,$random,$memory,$graphics,$bitmap)) {if ($null -ne $resource) {try {$resource.Dispose()}catch{}}}
}
