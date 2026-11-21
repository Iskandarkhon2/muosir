param(
    [int]$Port = 3000,
    [string]$Username = 'admin',
    [string]$Password = 'admin'
)

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
if ([string]::IsNullOrWhiteSpace($Username)) {
    Write-Error 'Username cannot be empty.'
    exit 1
}
if ([string]::IsNullOrWhiteSpace($Password)) {
    Write-Error 'Password cannot be empty.'
    exit 1
}

$env:ADMIN_PASSWORD_PLAIN = $Password
$passwordHash = & node (Join-Path $PSScriptRoot 'scripts\create-admin-hash-from-env.js')
$env:ADMIN_PASSWORD_PLAIN = $null

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($passwordHash)) {
    Write-Error 'Could not create the local administrator password hash.'
    exit 1
}

$env:ADMIN_USERNAME = $Username
$env:ADMIN_PASSWORD_HASH = $passwordHash
$env:PORT = [string]$Port
Remove-Variable passwordHash

$baseUrl = "http://127.0.0.1:$Port"
$serverScript = Join-Path $PSScriptRoot 'scripts\local-server.js'
$serverProcess = $null

trap {
    if ($null -ne $serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force
    }
    $env:ADMIN_USERNAME = $null
    $env:ADMIN_PASSWORD_HASH = $null
    $env:ADMIN_PASSWORD_PLAIN = $null
    break
}

try {
    Write-Host "Starting Muosir at $baseUrl"
    $serverProcess = Start-Process -FilePath 'node' -ArgumentList "`"$serverScript`"" -PassThru -NoNewWindow

    $started = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($serverProcess.HasExited) {
            throw "The local server exited before it became ready."
        }
        try {
            Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing -TimeoutSec 1 | Out-Null
            $started = $true
            break
        } catch {
            Start-Sleep -Milliseconds 200
        }
    }
    if (-not $started) {
        throw "The local server did not become ready at $baseUrl."
    }

    Start-Process "$baseUrl/admin-login.html"
    Write-Host "Local administrator login: $Username"
    Wait-Process -Id $serverProcess.Id
}
finally {
    if ($null -ne $serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force
    }
    $env:ADMIN_USERNAME = $null
    $env:ADMIN_PASSWORD_HASH = $null
    $env:ADMIN_PASSWORD_PLAIN = $null
}
