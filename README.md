# İlanHub

Ukrayna pazarı için çok kanallı ilan platformu.

**Repo:** [git.prozone.dev/kadir/ilanhub](https://git.prozone.dev/kadir/ilanhub)

## Özet

- **İlan verme:** Telegram, Viber, WhatsApp, Web
- **Otomatik yayın:** Telegram, Viber, WhatsApp, Instagram, Web
- **Dil:** Ukraynaca (`uk`)
- **Para birimi:** UAH (₴)
- **Stack:** NestJS, Next.js, React Admin, Docker, Redis, PostgreSQL + Drizzle

## Mimari

```
Kullanıcı → Bot/Web → NestJS API → Moderasyon → Worker → Kanallar
                         ↓
                   PostgreSQL + Redis + MinIO
```

Detay: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | API: [docs/API.md](docs/API.md) | Dev: [docs/DEV.md](docs/DEV.md)

## Monorepo Yapısı

```
apps/
  api/            NestJS REST (:3010 lokal, :3000 Docker)
  admin/          React moderatör paneli (:5173)
  web/            Next.js 15 site (:3004)
  bot-telegram/   Grammy bot (:3001)
  bot-viber/      Viber bot (:3002)
  bot-whatsapp/   WhatsApp bot (:3003)
  worker/         BullMQ yayın worker
packages/
  database/       Drizzle ORM + şema
  shared/         Tipler, state machine
  i18n/           Ukraynaca çeviriler
  pricing/        Fiyat motoru
  payments/       Monopay, LiqPay, havale
  analytics/      Event tracking
  ui/             Paylaşımlı React bileşenleri
```

## Kurulum

```bash
cp .env.example .env
docker compose up -d postgres redis minio
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `pnpm dev` | Tüm uygulamalar |
| `pnpm dev:api` | Sadece API |
| `pnpm dev:web` | Sadece web |
| `pnpm dev:web:clean` | `.next` temizle + web başlat |
| `pnpm dev:web:clean` | Web — port + .next temiz, yeniden başlat |
| `pnpm dev:admin` | Sadece admin |
| `pnpm dev:bots` | 3 bot |
| `pnpm db:push` | Şema sync |
| `pnpm db:seed` | Örnek veri |
| `pnpm db:studio` | Drizzle Studio |

### Web 500 hatası

Next.js dev sırasında bozuk `.next` önbelleği 500 döndürebilir.

1. Çalışan web sürecini durdur (`Ctrl+C` veya 3004 portunu kapat).
2. `pnpm dev:web:clean` çalıştır.
3. **Server çalışırken `apps/web/.next` silme** — cache kilitlenir, 500 tekrarlar.

Admin paneli (`:5173`) API isteklerini Vite proxy ile `:3010/api` adresine yönlendirir; `pnpm dev:api` bu portu kullanır.

## Docker Tam Stack

```bash
docker compose up -d --build
# http://localhost       → web
# http://localhost/api   → API
# http://localhost/admin → admin
```

## Geliştirme Fazları

| Faz | İçerik |
|-----|--------|
| 1 | Altyapı + UI temeli ✅ |
| 2 | Moderasyon + Telegram bot |
| 3 | Viber + WhatsApp |
| 4 | Instagram + ödeme |
| 5 | Prod hazırlık |
| 6 | Şehir filtreleri + abonelik |
| 7 | VIP, analitik, kullanıcı hesabı |
