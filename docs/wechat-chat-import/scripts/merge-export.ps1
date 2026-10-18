param(
    [string]$ManifestList = '',
    [string[]]$Fragments = @(),
    [string]$Contact = '邵冰婵',
    [string]$SelfLabel = '我',
    [string]$ExportPath = '',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_date.ps1')

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $ExportPath) {
    $ExportPath = Join-Path $repoRoot 'docs\聊天记录.json'
}

$blockedPattern = 'final-jul|synthetic|template-day'
$paths = @()
if ($ManifestList) {
    foreach ($line in Get-Content $ManifestList -Encoding UTF8) {
        $line = $line.Trim()
        if (-not $line -or $line.StartsWith('#')) { continue }
        $paths += $line
    }
}
$paths += $Fragments
$paths = $paths | Where-Object { $_ } | Select-Object -Unique

if ($paths.Count -eq 0) { throw 'no fragment paths (use -ManifestList or -Fragments)' }

$all = New-Object System.Collections.ArrayList
$batches = New-Object System.Collections.ArrayList

foreach ($p in $paths) {
    if ($p -match $blockedPattern) { throw "blocked synthetic file: $p" }
    if (-not (Test-Path $p)) { throw "missing fragment: $p" }
    $raw = Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($raw.batchId) { [void]$batches.Add($raw.batchId) }
    if ($raw.contact -and $raw.contact -ne $Contact) {
        Write-Warning "contact mismatch in $p : $($raw.contact) vs $Contact"
    }
    if ($raw.PSObject.Properties.Name -contains 'messages') {
        $msgs = @($raw.messages)
    } else {
        $msgs = @($raw)
    }
    foreach ($m in $msgs) { [void]$all.Add($m) }
}

function Get-OverlapDedupeKey($m) {
    return $m.from + '|' + $m.text
}

$sorted = $all | Sort-Object { ConvertFrom-WeChatAt $_.at }

$seenExact = @{}
$out = New-Object System.Collections.ArrayList
$lastByOverlap = @{}

foreach ($m in $sorted) {
    $exact = $m.from + '|' + $m.at + '|' + $m.text
    if ($seenExact.ContainsKey($exact)) { continue }
    $seenExact[$exact] = $true

    $t = ConvertFrom-WeChatAt $m.at
    $okey = Get-OverlapDedupeKey $m
    if ($lastByOverlap.ContainsKey($okey)) {
        $prevT = $lastByOverlap[$okey].time
        if (($t - $prevT).TotalMinutes -le 2) { continue }
    }
    $lastByOverlap[$okey] = @{ time = $t }
    [void]$out.Add($m)
}

$doc = [ordered]@{
    self     = $SelfLabel
    contact  = $Contact
    meta     = [ordered]@{
        pipelineVersion = 1
        builtAt         = (Get-Date).ToString('o')
        batches         = @($batches | Select-Object -Unique)
        gaps            = @()
    }
    messages = @($out)
}

$reportDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'reports'
New-Item -ItemType Directory -Force $reportDir | Out-Null
$staging = Join-Path $reportDir ('staging-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
$json = $doc | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($staging, $json, (New-Object System.Text.UTF8Encoding $false))

& (Join-Path $PSScriptRoot 'qa-export.ps1') -Export $staging
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    if (-not $Force) { throw "QA failed on staging file; not writing $ExportPath" }
    Write-Warning 'QA failed but -Force set'
}

[System.IO.File]::WriteAllText($ExportPath, $json, (New-Object System.Text.UTF8Encoding $false))
Write-Output "written $($out.Count) messages -> $ExportPath (staging $staging)"
