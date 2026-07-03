# Safe web dev: stop old instance, clear .next, start fresh.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pnpm = Join-Path $env:LOCALAPPDATA "ilanhub-pnpm\pnpm.exe"
if (-not (Test-Path $pnpm)) { $pnpm = "pnpm" }

function Stop-PortListener([int]$Port) {
  for ($i = 0; $i -lt 10; $i++) {
    $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
    if (-not $pids) { return }
    foreach ($pid in $pids) {
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
  }
  $left = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($left) {
    throw "Port $Port hâlâ dolu (PID $($left[0].OwningProcess)). Önce diğer next dev süreçlerini kapatın."
  }
}

Stop-PortListener -Port 3004

$nextDir = Join-Path $root "apps\web\.next"
if (Test-Path $nextDir) { Remove-Item -Recurse -Force $nextDir }

$env:API_URL = "http://localhost:3010"
$env:NEXT_PUBLIC_API_URL = "http://localhost:3010"

Set-Location $root
& $pnpm --filter @ilanhub/web dev
