param(
    [Parameter(Mandatory = $true)][string]$Dir,
    [int]$PreScroll = 50,
    [int]$ScrollDir = -300,
    [int]$Frames = 8,
    [int]$PreDelayMs = 50,
    [int]$FrameDelayMs = 400,
    [int]$WinH = 1000,
    [int]$CapH = 885
)

$ErrorActionPreference = 'Stop'
try { [WxCapPipeline] | Out-Null } catch {
    Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WxCapPipeline {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, int data, System.UIntPtr extra);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int ht, bool rep);
  public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder s, int n);
  public static IntPtr Target;
  public static bool Cb(IntPtr h, IntPtr l) {
    if (!IsWindowVisible(h)) return true;
    var sb = new StringBuilder(256);
    GetWindowText(h, sb, sb.Capacity);
    if (sb.ToString() == "微信") Target = h;
    return true;
  }
}
"@
}

[WxCapPipeline]::SetProcessDPIAware() | Out-Null
[WxCapPipeline]::Target = [IntPtr]::Zero
[WxCapPipeline]::EnumWindows({ param($h, $l) [WxCapPipeline]::Cb($h, $l) }, [IntPtr]::Zero) | Out-Null
$hwnd = [WxCapPipeline]::Target
if ($hwnd -eq [IntPtr]::Zero) { throw 'wechat window not found (title must be 微信)' }

[WxCapPipeline]::ShowWindow($hwnd, 9) | Out-Null
[WxCapPipeline]::MoveWindow($hwnd, 280, 15, 1400, $WinH, $true) | Out-Null
[WxCapPipeline]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 400
[WxCapPipeline]::SetCursorPos(850, 500) | Out-Null
for ($i = 0; $i -lt $PreScroll; $i++) {
    [WxCapPipeline]::mouse_event(0x0800, 0, 0, $ScrollDir, [System.UIntPtr]::Zero)
    Start-Sleep -Milliseconds $PreDelayMs
}

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Dir | Out-Null

function Shot([int]$i) {
    for ($try = 0; $try -lt 5; $try++) {
        [WxCapPipeline]::ShowWindow($hwnd, 9) | Out-Null
        [WxCapPipeline]::SetForegroundWindow($hwnd) | Out-Null
        Start-Sleep -Milliseconds 500
        if ([WxCapPipeline]::GetForegroundWindow() -ne $hwnd) {
            Write-Warning "frame $i not foreground, retry $try"
            Start-Sleep -Milliseconds 800
            continue
        }
        $bmp = New-Object System.Drawing.Bitmap 1050, $CapH
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.CopyFromScreen(350, 55, 0, 0, (New-Object System.Drawing.Size 1050, $CapH))
        $sum = 0; $n = 0
        for ($x = 80; $x -lt 1000; $x += 90) {
            for ($y = 80; $y -lt ($CapH - 35); $y += 90) {
                $p = $bmp.GetPixel($x, $y)
                $sum += ($p.R + $p.G + $p.B)
                $n++
            }
        }
        $avg = $sum / $n / 3
        if ($avg -gt 60) {
            $out = Join-Path $Dir ('{0:D2}.png' -f $i)
            $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
            $g.Dispose(); $bmp.Dispose()
            Write-Output "frame $i ok brightness=$([int]$avg) -> $out"
            return
        }
        $g.Dispose(); $bmp.Dispose()
        Write-Warning "frame $i black, retry $try"
        Start-Sleep -Milliseconds 600
    }
    throw "frame $i still black"
}

for ($i = 0; $i -lt $Frames; $i++) {
    Shot $i
    [WxCapPipeline]::mouse_event(0x0800, 0, 0, -300, [System.UIntPtr]::Zero)
    Start-Sleep -Milliseconds $FrameDelayMs
}

Write-Output "capture done; run validate-frames.ps1 before OCR"
