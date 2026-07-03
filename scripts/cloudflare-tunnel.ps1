# Cloudflare hizli tunnel (dev) — PowerShell 5.1 uyumlu
# Gereksinim: cloudflared kurulu
#   winget install Cloudflare.cloudflared
#
# Kullanim:
#   .\scripts\cloudflare-tunnel.ps1           # nginx :80 (tam stack)
#   .\scripts\cloudflare-tunnel.ps1 -Port 3001  # sadece telegram bot
#
# Webhook URL: https://xxxx.trycloudflare.com/webhooks/telegram

param(
    [int]$Port = 0
)

$ErrorActionPreference = "Stop"

function Get-CloudflaredExe {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cfPath = Join-Path ${env:ProgramFiles} "cloudflared\cloudflared.exe"
    if (Test-Path $cfPath) { return $cfPath }
    return $null
}

$cfExe = Get-CloudflaredExe
if (-not $cfExe) {
    Write-Host "cloudflared yok. Kur:" -ForegroundColor Red
    Write-Host "  winget install Cloudflare.cloudflared"
    exit 1
}

if ($Port -eq 0) {
    $nginx = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
    if ($nginx) { $Port = 80 } else { $Port = 3001 }
}

$target = "http://127.0.0.1:$Port"
Write-Host ""
Write-Host "Cloudflare Tunnel -> $target" -ForegroundColor Cyan
if ($Port -eq 80) {
    Write-Host "Webhook: https://<tunnel-url>/webhooks/telegram"
    Write-Host "Admin:   https://<tunnel-url>/admin"
} else {
    Write-Host "Webhook: https://<tunnel-url>/webhooks/telegram  (sadece bot)"
    Write-Host "Not: API icin nginx :80 veya tam stack kullanin."
}
Write-Host ""
Write-Host "URL ciktiktan sonra admin panele yapistirin ve 'Webhook Kur' basin."
Write-Host ""

& $cfExe tunnel --url $target
