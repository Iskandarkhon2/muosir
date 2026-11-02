$msi = Join-Path $env:TEMP "node.msi"
Write-Output "Installing Node from $msi..."
$p = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$msi`" /qn /norestart" -Verb RunAs -Wait -PassThru
Write-Output "Exit code: $($p.ExitCode)"
