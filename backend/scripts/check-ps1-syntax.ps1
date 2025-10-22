<#
Checks PowerShell syntax of migrate-dev-to-prod.ps1 using the PowerShell parser.
#>
$scriptPath = Join-Path $PSScriptRoot 'migrate-dev-to-prod.ps1'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Script not found: $scriptPath"
  exit 2
}

$errors = $null
[System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$errors, [ref]$null) | Out-Null
if ($errors -and $errors.Count -gt 0) {
  Write-Host "Syntax errors detected in ${scriptPath}:`n" -ForegroundColor Red
  foreach ($e in $errors) {
    Write-Host "Message: $($e.Message)" -ForegroundColor Yellow
    Write-Host "Context: $($e.Extent.Text)`n"
  }
  exit 1
} else {
  Write-Host "No syntax errors detected in $scriptPath." -ForegroundColor Green
  exit 0
}
