param(
    [Parameter(Mandatory = $true)][string]$Dir,
    [switch]$StrictPixelDiff
)

$ErrorActionPreference = 'Stop'
$files = Get-ChildItem $Dir -Filter '*.png' | Sort-Object Name
if ($files.Count -lt 2) { throw "need at least 2 frames in $Dir" }

$hashes = @($files | ForEach-Object { (Get-FileHash $_.FullName -Algorithm SHA256).Hash })
$dupAdjacent = 0
for ($i = 1; $i -lt $hashes.Count; $i++) {
    if ($hashes[$i] -eq $hashes[$i - 1]) { $dupAdjacent++ }
}
if ($dupAdjacent -gt 0) {
    throw "FAIL: $dupAdjacent adjacent frame(s) are identical (scroll/capture broken). Do not OCR this batch."
}

$unique = ($hashes | Select-Object -Unique).Count
if ($unique -eq 1) {
    throw 'FAIL: all frames share one hash — entire batch is duplicate.'
}

Write-Output "OK: $($files.Count) frames, $unique unique hashes, 0 adjacent duplicates"

if ($StrictPixelDiff) {
    Add-Type -AssemblyName System.Drawing
    $prev = $null
    foreach ($f in $files) {
        $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
        if ($prev) {
            $same = 0; $total = 0
            for ($y = 100; $y -lt [Math]::Min($bmp.Height, $prev.Height) - 100; $y += 40) {
                for ($x = 100; $x -lt [Math]::Min($bmp.Width, $prev.Width) - 100; $x += 40) {
                    $total++
                    $a = $bmp.GetPixel($x, $y)
                    $b = $prev.GetPixel($x, $y)
                    if ($a.R -eq $b.R -and $a.G -eq $b.G -and $a.B -eq $b.B) { $same++ }
                }
            }
            $ratio = $same / [double]$total
            if ($ratio -gt 0.98) {
                $bmp.Dispose(); $prev.Dispose()
                throw "FAIL: $($f.Name) is ~$([int]($ratio * 100))% identical to previous frame (pixel diff)."
            }
        }
        $prev = $bmp
    }
    if ($prev) { $prev.Dispose() }
    Write-Output 'OK: strict pixel diff passed'
}
