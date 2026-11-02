$env:Path = "C:\Program Files\nodejs;" + $env:Path
Write-Output "Node version: $(node -v)"
Write-Output "Running playwright install..."
npx -y playwright install chromium
Write-Output "Finished playwright install. Checking directory:"
if (Test-Path "$env:USERPROFILE\AppData\Local\ms-playwright") {
    Get-ChildItem "$env:USERPROFILE\AppData\Local\ms-playwright"
} else {
    Write-Output "ms-playwright directory not found yet"
}
