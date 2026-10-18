param(
    [Parameter(Mandatory = $true)][string]$Fragment
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_date.ps1')
. (Join-Path $PSScriptRoot '_qa-template.ps1')
$tpl = Get-TemplateConfig

if ($Fragment -match 'final-jul|synthetic|template-day') {
    throw "FAIL: fragment path looks synthetic ($Fragment). See PIPELINE.md."
}

$raw = Get-Content $Fragment -Raw -Encoding UTF8 | ConvertFrom-Json
if ($raw.PSObject.Properties.Name -contains 'messages') {
    $msgs = @($raw.messages)
} else {
    $msgs = @($raw)
}
if ($msgs.Count -eq 0) { throw 'FAIL: empty fragment' }

$badFrom = $msgs | Where-Object { $_.from -notin @('self', 'contact') }
if ($badFrom) { throw "FAIL: invalid from values (must be self|contact)" }

foreach ($m in $msgs) {
    if (-not (Test-WeChatAt $m.at)) { throw "FAIL: invalid at '$($m.at)'" }
    if (-not $m.text) { throw 'FAIL: empty text' }
}

$shortCount = ($msgs | Where-Object { $tpl.shortPhrases -contains $_.text }).Count
$ratio = $shortCount / $msgs.Count
if ($ratio -gt 0.85 -and $msgs.Count -ge 12) {
    throw "FAIL: $($ratio.ToString('P0')) short template phrases — likely synthetic day script."
}

$script = @($tpl.routineScript)
$scriptHits = 0
for ($i = 0; $i -le $msgs.Count - $script.Count; $i++) {
    $ok = $true
    for ($j = 0; $j -lt $script.Count; $j++) {
        if ($msgs[$i + $j].text -ne $script[$j]) { $ok = $false; break }
    }
    if ($ok) { $scriptHits++ }
}
if ($scriptHits -ge 2) {
    throw "FAIL: daily routine template appears $scriptHits times in one fragment."
}

Write-Output "OK: fragment $($msgs.Count) messages, template ratio $([int]($ratio * 100))%"
