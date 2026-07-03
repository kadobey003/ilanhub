# İlanHub API Referansı

Base URL: `http://localhost:3000/api` (nginx: `http://localhost/api`)

## Health

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/health` | Servis durumu |

## Projeler

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/projects` | Tüm projeler `{ data: [] }` |
| GET | `/projects/:id` | Proje detayı |
| POST | `/projects` | Yeni proje |
| PATCH | `/projects/:id` | Güncelle |
| DELETE | `/projects/:id` | Sil |

## Katalog

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/projects/:projectId/categories` | Kategoriler |
| GET | `/projects/:projectId/cities` | Şehirler |

## İlanlar

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/listings` | Tüm ilanlar |
| GET | `/listings/:id` | Detay |
| POST | `/listings` | Oluştur (draft) |
| PATCH | `/listings/:id` | Güncelle |
| DELETE | `/listings/:id` | Sil |
| POST | `/listings/:id/submit` | Moderasyona gönder |

**Durum akışı:** `draft` → `pending_payment` / `pending_moderation` → `approved` → `publishing` → `published`

## Moderasyon

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/moderation/pending` | Bekleyen ilanlar |
| POST | `/moderation/:id/approve` | Onayla → worker kuyruğu |
| POST | `/moderation/:id/reject` | Reddet |

## Ödemeler

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/payments/create` | Ödeme başlat |
| POST | `/payments/webhooks/monopay` | Monopay webhook |
| POST | `/payments/webhooks/liqpay` | LiqPay callback |

## Kullanıcılar

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/users/me` | Header: `x-user-id` |
| GET | `/users/:channel/:externalId/listings` | Bot kullanıcı ilanları |
| GET | `/users/:id/listings` | UUID ile ilanlar |

## Kanallar

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/projects/:id/channels` | Kanal config listesi |
| POST | `/projects/:id/channels` | Kanal ekle |

## Medya

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/media/upload` | MinIO'ya yükle |

## Webhook'lar

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/webhooks/telegram` | Telegram update proxy |
| POST | `/webhooks/viber` | Viber event proxy |
| POST | `/webhooks/whatsapp` | WhatsApp webhook proxy |

## Analitik

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/analytics/events` | Event kaydet |
| GET | `/analytics/stats` | Günlük istatistikler |

## Worker Kuyruğu

- Kuyruk: `publish-listing`
- Payload: `{ listingId: string }`
- Onay sonrası API otomatik job ekler
