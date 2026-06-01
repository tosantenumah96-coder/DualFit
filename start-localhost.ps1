$projectRoot = "C:\Users\tosan\Documents\Codex\DualFit"
$serverUrl = "http://localhost:4173"
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Sort-Object InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress)

Set-Location $projectRoot

$existingServer = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq "node.exe" -and
    $_.CommandLine -like "*server.js*DualFit*"
  } |
  Select-Object -First 1

if (-not $existingServer) {
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $projectRoot -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

Write-Host "Local URL: $serverUrl"
if ($lanIp) {
  Write-Host "iPhone URL: http://$lanIp`:4173"
}

Start-Process $serverUrl
