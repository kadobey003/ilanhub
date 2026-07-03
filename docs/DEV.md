# Geliştirme Notları

## Portlar

| Servis | Port |
|--------|------|
| API | 3010 |
| Web | 3004 |
| Admin | 5173 |
| Redis | 6450 |

## Web başlatma

```bash
pnpm dev:web:clean   # önerilen — port temizler, .next siler, başlatır
pnpm dev:web         # normal dev
```

PowerShell: `scripts/dev-web.ps1`

## Internal Server Error (500)

**Neden:** `apps/web/.next` cache bozulması.

**Çözüm:** `pnpm dev:web:clean`

**Önlem:**
- Server çalışırken `.next` silmeyin
- Tek `next dev` instance (port 3004)
- `next.config.mjs` → dev'de `config.cache = false`
- `apps/web/.env.local` → `API_URL=http://localhost:3010`

## API

```bash
PORT=3010 REDIS_URL=redis://localhost:6450 pnpm dev:api
```

## Cloudflare Tunnel (localhost → HTTPS)

Telegram webhook için HTTPS şart. Cloudflare Tunnel ücretsiz SSL verir.

**Hızlı (dev):**
```bash
# 1. cloudflared kur: winget install Cloudflare.cloudflared
# 2. Servisler çalışsın (api, bot-telegram, redis) veya docker nginx :80
pnpm tunnel
# 3. Çıkan URL → admin Telegram → Webhook URL:
#    https://xxxx.trycloudflare.com/webhooks/telegram
```

**Kalıcı (kendi domain):**
1. Domain Cloudflare'de
2. Zero Trust → Networks → Tunnels → Create
3. Public hostname: `dev.sizin-domain.com` → `http://localhost:80`
4. `.env` → `PUBLIC_URL=https://dev.sizin-domain.com`
5. Docker: `CLOUDFLARE_TUNNEL_TOKEN=... docker compose --profile tunnel up -d`
