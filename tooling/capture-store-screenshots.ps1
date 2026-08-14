$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mobile = Join-Path $root 'apps\mobile'
$output = Join-Path $root 'docs\release\screenshots'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw 'Google Chrome is required to capture store screenshots.' }
New-Item -ItemType Directory -Force -Path $output | Out-Null
Remove-Item (Join-Path $output '*.png') -Force -ErrorAction SilentlyContinue

Push-Location $root
try {
  npm run mobile:build
  if ($LASTEXITCODE -ne 0) { throw 'Mobile production build failed.' }
} finally { Pop-Location }

$port = Get-Random -Minimum 4200 -Maximum 4900
$baseUrl = "http://127.0.0.1:$port"
$server = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','preview','--','--host','127.0.0.1','--port',"$port") -WorkingDirectory $mobile -PassThru -WindowStyle Hidden
try {
  $ready = $false
  foreach ($attempt in 1..30) {
    try {
      $response = Invoke-WebRequest "$baseUrl/" -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 300 }
  }
  if (-not $ready) { throw 'Preview server did not become ready.' }

  node (Join-Path $root 'tooling\capture-mobile-cdp.mjs') $baseUrl $output
  if ($LASTEXITCODE -ne 0) { throw 'CDP mobile screenshot capture failed.' }
} finally {
  & taskkill.exe /PID $server.Id /T /F 2>$null | Out-Null
}
Get-ChildItem $output -Filter '*.png' | Select-Object Name,Length
