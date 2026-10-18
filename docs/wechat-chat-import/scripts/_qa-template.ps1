function Get-TemplateConfig {
    $path = Join-Path $PSScriptRoot 'template-words.json'
    return Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
}
