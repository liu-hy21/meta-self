# ASCII-only: PowerShell 5.1 defaults to ANSI for non-BOM UTF-8 scripts.
$script:WeChatAtPattern = '^\d{4}\u5e74\d{2}\u6708\d{2}\u65e5\d{2}:\d{2}$'

function ConvertFrom-WeChatAt {
    param([string]$At)
    if ($At -match $script:WeChatAtPattern) {
        $digits = ($At -replace '\D', '')
        if ($digits.Length -ne 12) { throw "invalid at digits: $At" }
        return [datetime]::ParseExact($digits, 'yyyyMMddHHmm', $null)
    }
    throw "invalid at: $At"
}

function Test-WeChatAt {
    param([string]$At)
    return $At -match $script:WeChatAtPattern
}
