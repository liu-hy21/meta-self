param(
    [Parameter(Mandatory = $true)][string]$Export
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_date.ps1')
. (Join-Path $PSScriptRoot '_qa-template.ps1')
$tpl = Get-TemplateConfig

$raw = Get-Content $Export -Raw -Encoding UTF8 | ConvertFrom-Json
$msgs = @($raw.messages)
if ($msgs.Count -eq 0) { throw 'FAIL: no messages' }

if (-not $raw.meta -or -not $raw.meta.pipelineVersion) {
    throw 'FAIL: missing meta.pipelineVersion (use merge-export.ps1)'
}

$back = 0
for ($i = 1; $i -lt $msgs.Count; $i++) {
    $a = ConvertFrom-WeChatAt $msgs[$i - 1].at
    $b = ConvertFrom-WeChatAt $msgs[$i].at
    if ($b -lt $a) { $back++ }
}
if ($back -gt 0) { throw "FAIL: timeline goes backward $back times" }

$seen = @{}
foreach ($m in $msgs) {
    $k = $m.from + '|' + $m.at + '|' + $m.text
    if ($seen.ContainsKey($k)) { throw "FAIL: duplicate exact message $k" }
    $seen[$k] = $true
}

$shortCount = ($msgs | Where-Object { $tpl.shortPhrases -contains $_.text }).Count
$ratio = $shortCount / $msgs.Count

$script = @($tpl.routineScript)
$scriptHits = 0
for ($i = 0; $i -le $msgs.Count - $script.Count; $i++) {
    $ok = $true
    for ($j = 0; $j -lt $script.Count; $j++) {
        if ($msgs[$i + $j].text -ne $script[$j]) { $ok = $false; break }
    }
    if ($ok) { $scriptHits++ }
}

if ($ratio -gt 0.40 -and $scriptHits -ge 3) {
    throw "FAIL: template spam ratio $([int]($ratio * 100))%, routine script x$scriptHits (likely final-jul style data)"
}

$reportDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'reports'
New-Item -ItemType Directory -Force $reportDir | Out-Null
$report = @(
    "QA OK $(Get-Date -Format o)"
    "file: $Export"
    "messages: $($msgs.Count)"
    "template short phrase ratio: $([int]($ratio * 100))%"
    "routine script hits: $scriptHits"
    "timeline backward: $back"
)
$reportPath = Join-Path $reportDir ('qa-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.txt')
$report | Set-Content -Path $reportPath -Encoding UTF8
Write-Output ($report -join "`n")
exit 0
