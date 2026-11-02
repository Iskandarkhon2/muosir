param([int]$Port = 3000)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js 20 or newer is required. Install Node.js before starting the application.'
    exit 1
}
$nodeVersion = (node --version).TrimStart('v')
if ([version]$nodeVersion -lt [version]'20.0') {
    Write-Error 'Node.js 20 or newer is required. Install a supported version before starting the application.'
    exit 1
}
if ([string]::IsNullOrWhiteSpace($env:ADMIN_USERNAME) -or [string]::IsNullOrWhiteSpace($env:ADMIN_PASSWORD_HASH)) {
    Write-Error 'Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH in this PowerShell session before starting.'
    Write-Host 'Create a password hash with: $env:ADMIN_PASSWORD_HASH = node .\scripts\create-admin-hash.js'
    exit 1
}

$env:PORT = [string]$Port
node (Join-Path $PSScriptRoot 'server.js')
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
