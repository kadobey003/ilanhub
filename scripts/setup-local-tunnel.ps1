# IlanHub lokal dev: bot + cloudflare tunnel + telegram webhook
# PowerShell 5.1 uyumlu
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Pnpm = Join-Path $env:LOCALAPPDATA "ilanhub-pnpm\pnpm.exe"
if (-not (Test-Path $Pnpm)) { $Pnpm = "pnpm" }
$env:PATH = "$(Split-Path $Pnpm -Parent);$env:PATH"
$env:DATABASE_URL = "postgresql://ilanhub:secret@localhost:5432/ilanhub"
$env:REDIS_URL = "redis://localhost:6450"
$env:PORT = "3010"
$env:API_URL = "http://localhost:3010"

$LogDir = Join-Path $Root ".local"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$TunnelLog = Join-Path $LogDir "cloudflared.log"
$TunnelErrLog = Join-Path $LogDir "cloudflared.log.err"
$BotLog = Join-Path $LogDir "bot-telegram.log"
$BotErrLog = Join-Path $LogDir "bot-telegram.log.err"
$InfoFile = Join-Path $LogDir "tunnel-info.json"

function Test-Port([int]$port) {
    $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return [bool]$c
}

function Get-CloudflaredExe {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cfPath = Join-Path ${env:ProgramFiles} "cloudflared\cloudflared.exe"
    if (Test-Path $cfPath) { return $cfPath }
    throw "cloudflared yok. winget install Cloudflare.cloudflared"
}

function Read-CombinedLog([string]$stdoutPath, [string]$stderrPath) {
    $parts = @()
    if (Test-Path $stdoutPath) {
        $parts += Get-Content $stdoutPath -Raw -ErrorAction SilentlyContinue
    }
    if (Test-Path $stderrPath) {
        $parts += Get-Content $stderrPath -Raw -ErrorAction SilentlyContinue
    }
    return ($parts -join [Environment]::NewLine)
}

function Find-TryCloudflareUrl([string]$text) {
    if ($text -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
        return $Matches[1]
    }
    return $null
}

# API :3010
if (-not (Test-Port 3010)) {
    Write-Host "API baslatiliyor :3010..."
    Start-Process -FilePath $Pnpm -ArgumentList "--filter","@ilanhub/api","dev" `
        -WorkingDirectory $Root -WindowStyle Hidden
    $n = 0
    while (-not (Test-Port 3010) -and $n -lt 60) { Start-Sleep -Seconds 2; $n++ }
    if (-not (Test-Port 3010)) { throw "API baslamadi" }
}
Write-Host "API OK :3010"

# Admin login + Telegram aktif (bot token icin once)
$adminEmail = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@ilanhub.local" }
$adminPass = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "admin123" }
$login = Invoke-RestMethod -Uri "http://localhost:3010/api/admin/auth/login" -Method POST `
    -ContentType "application/json" -Body (@{ email = $adminEmail; password = $adminPass } | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($login.token)" }
$projects = Invoke-RestMethod -Uri "http://localhost:3010/api/admin/projects" -Headers $h
$projectId = $projects.data[0].id
$tg = Invoke-RestMethod -Uri "http://localhost:3010/api/admin/settings/telegram?projectId=$projectId" -Headers $h
if (-not $tg.data.botToken) {
    throw "Admin panelden Telegram Bot Token kaydedin, sonra tekrar calistirin."
}

# isActive icin botToken gerekli (API sadece isActive ile guncellemez)
Invoke-RestMethod -Uri "http://localhost:3010/api/admin/settings/telegram" -Method PATCH `
    -Headers $h -ContentType "application/json" `
    -Body (@{
        projectId = $projectId
        botToken  = $tg.data.botToken
        isActive  = $true
    } | ConvertTo-Json) | Out-Null
Write-Host "Telegram aktif ($($tg.data.botUsername))"

# Bot config endpoint dogrula
$configOk = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $cfg = Invoke-RestMethod -Uri "http://localhost:3010/api/bots/telegram/config" `
            -Headers @{ "x-bot-secret" = "dev-bot-secret" }
        if ($cfg.botToken) { $configOk = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
}
if (-not $configOk) { throw "Telegram config aktif degil - bot token alinamadi" }

# Bot :3001
if (-not (Test-Port 3001)) {
    Write-Host "bot-telegram baslatiliyor :3001..."
    $env:PORT = "3001"
    $env:API_URL = "http://localhost:3010"
    $env:REDIS_URL = "redis://localhost:6450"
    $env:BOT_INTERNAL_SECRET = "dev-bot-secret"
    Remove-Item $BotLog -Force -ErrorAction SilentlyContinue
    Remove-Item $BotErrLog -Force -ErrorAction SilentlyContinue
    $botArgs = @{
        FilePath             = $Pnpm
        ArgumentList         = @("--filter","@ilanhub/bot-telegram","dev")
        WorkingDirectory     = $Root
        WindowStyle          = "Hidden"
        RedirectStandardOutput = $BotLog
        RedirectStandardError  = $BotErrLog
    }
    try {
        Start-Process @botArgs | Out-Null
    } catch {
        Start-Process -FilePath $Pnpm -ArgumentList "--filter","@ilanhub/bot-telegram","dev" `
            -WorkingDirectory $Root -WindowStyle Hidden | Out-Null
    }
    $n = 0
    while (-not (Test-Port 3001) -and $n -lt 45) { Start-Sleep -Seconds 2; $n++ }
    if (-not (Test-Port 3001)) {
        $botLogText = Read-CombinedLog $BotLog $BotErrLog
        throw "bot-telegram baslamadi - $BotLog`n$botLogText"
    }
}
Write-Host "Bot OK :3001"

# cloudflared quick tunnel -> :3001
$cfExe = Get-CloudflaredExe
Remove-Item $TunnelLog -Force -ErrorAction SilentlyContinue
Remove-Item $TunnelErrLog -Force -ErrorAction SilentlyContinue
Write-Host "Cloudflare tunnel baslatiliyor..."
$tunnelProc = Start-Process -FilePath $cfExe `
    -ArgumentList "tunnel","--url","http://127.0.0.1:3001" `
    -RedirectStandardOutput $TunnelLog -RedirectStandardError $TunnelErrLog `
    -PassThru -WindowStyle Hidden

$tunnelUrl = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    $logText = Read-CombinedLog $TunnelLog $TunnelErrLog
    $tunnelUrl = Find-TryCloudflareUrl $logText
    if ($tunnelUrl) { break }
}
if (-not $tunnelUrl) {
    $logText = Read-CombinedLog $TunnelLog $TunnelErrLog
    throw "Tunnel URL alinamadi - $TunnelLog`n$logText"
}

# Tunnel DNS hazir olsun
Write-Host "Tunnel hazir bekleniyor..."
$tunnelReady = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$tunnelUrl/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $tunnelReady = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $tunnelReady) { Write-Host "Tunnel henuz erisilemiyor, webhook yine de denenecek..." -ForegroundColor Yellow }

$webhookUrl = "$tunnelUrl/webhooks/telegram"
Write-Host "Tunnel: $tunnelUrl"
Write-Host "Webhook: $webhookUrl"

Invoke-RestMethod -Uri "http://localhost:3010/api/admin/settings/telegram" -Method PATCH `
    -Headers $h -ContentType "application/json" `
    -Body (@{
        projectId  = $projectId
        botToken   = $tg.data.botToken
        webhookUrl = $webhookUrl
        isActive   = $true
    } | ConvertTo-Json) | Out-Null

$webhookOk = $false
for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
        $wh = Invoke-RestMethod -Uri "http://localhost:3010/api/admin/settings/telegram/webhook" -Method POST `
            -Headers $h -ContentType "application/json" -Body (@{ projectId = $projectId } | ConvertTo-Json)
        Write-Host "Webhook kuruldu: $($wh.webhookUrl)" -ForegroundColor Green
        $webhookOk = $true
        break
    } catch {
        if ($attempt -lt 5) {
            Write-Host "Webhook deneme $attempt/5, 5s bekleniyor..."
            Start-Sleep -Seconds 5
        } else {
            $err = $_.Exception.Message
            if ($_.ErrorDetails.Message) { $err = $_.ErrorDetails.Message }
            Write-Host "Webhook hatasi: $err" -ForegroundColor Yellow
        }
    }
}

$info = @{
    tunnelUrl    = $tunnelUrl
    webhookUrl   = $webhookUrl
    tunnelPid    = $tunnelProc.Id
    projectId    = $projectId
    botUsername  = $tg.data.botUsername
    webhookOk    = $webhookOk
    updatedAt    = (Get-Date).ToString("o")
}
$info | ConvertTo-Json | Set-Content -Path $InfoFile -Encoding UTF8

Write-Host ""
Write-Host "=== HAZIR ===" -ForegroundColor Cyan
Write-Host "Telegram: $($tg.data.botUsername)"
Write-Host "Webhook: $webhookUrl"
Write-Host "Tunnel PID: $($tunnelProc.Id) (kapatmayin)"
Write-Host "Admin: http://localhost:5173"
Write-Host "Info: $InfoFile"
Write-Host "Log: $TunnelLog"
