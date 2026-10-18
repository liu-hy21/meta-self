param(
    [Parameter(Mandatory = $true)][string]$BatchDir,
    [Parameter(Mandatory = $true)][string]$Contact,
    [string]$BatchId = '',
    [int]$Frames = 8
)

$ErrorActionPreference = 'Stop'
if (-not $BatchId) {
    $BatchId = 'batch-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
}

New-Item -ItemType Directory -Force -Path $BatchDir, (Join-Path $BatchDir 'frames'), (Join-Path $BatchDir 'ocr'), (Join-Path $BatchDir 'fragments') | Out-Null

$manifest = [ordered]@{
    batchId     = $BatchId
    contact     = $Contact
    capture     = @{ frames = $Frames; scrollDelta = -300; preScroll = 50 }
    timeRangeHint = @{ from = ''; to = '' }
    pipelineVersion = 1
}

$path = Join-Path $BatchDir 'manifest.json'
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $path -Encoding UTF8
Write-Output "created $path batchId=$BatchId"
