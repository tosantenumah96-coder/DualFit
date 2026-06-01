$projectRoot = "C:\Users\tosan\Documents\Codex\DualFit"

Set-Location $projectRoot

function Get-DualFitLanIp {
  $preferred = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.IPAddress -notlike "192.168.56.*" -and
      $_.PrefixOrigin -ne "WellKnown"
    } |
    Sort-Object -Property InterfaceMetric |
    Select-Object -First 1

  if ($preferred) {
    return $preferred.IPAddress
  }

  return "127.0.0.1"
}

function Stop-PortProcess {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess
    if ($processId) {
      Write-Host "Stopping process on port $Port (PID $processId)..." -ForegroundColor Yellow
      taskkill /PID $processId /F | Out-Null
    }
  }
}

$lanIp = Get-DualFitLanIp

Stop-PortProcess -Port 8081
Stop-PortProcess -Port 8082
Stop-PortProcess -Port 4173

$env:EXPO_NO_DEPENDENCY_VALIDATION = "1"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $lanIp
$env:EXPO_PUBLIC_FATSECRET_PROXY_URL = "http://$lanIp`:4173/api/fatsecret"

$envLocalPath = Join-Path $projectRoot ".env.local"
$envLocalLines = @()
if (Test-Path $envLocalPath) {
  $envLocalLines = Get-Content $envLocalPath | Where-Object {
    $_ -notmatch "^EXPO_PUBLIC_FATSECRET_PROXY_URL="
  }
}
$envLocalLines += "EXPO_PUBLIC_FATSECRET_PROXY_URL=$($env:EXPO_PUBLIC_FATSECRET_PROXY_URL)"
Set-Content -Path $envLocalPath -Value $envLocalLines

Write-Host "Starting DualFit API proxy on $lanIp`:4173" -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "Set-Location '$projectRoot'; node server.js"
)

Write-Host "Starting DualFit Expo on $lanIp`:8081" -ForegroundColor Green
Write-Host "Project: $projectRoot" -ForegroundColor DarkGray

cmd /c npx expo start --lan -c
