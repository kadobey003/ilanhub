# İlanHub — Mimari Plan

> **Repo:** [git.prozone.dev/kadir/ilanhub](https://git.prozone.dev/kadir/ilanhub)

## 1. Genel Bakış

| Alan | Değer |
|------|-------|
| Pazar | Ukrayna |
| Arayüz dili | Ukraynaca (`uk`) |
| Para birimi | UAH (₴) |
| Stack | NestJS, Next.js, React Admin, Docker |
| Monorepo | Turborepo + pnpm |
| DB | **PostgreSQL 16 + Drizzle ORM** |

### Kanal Matrisi

| Tür | Kanallar |
|-----|----------|
| **İlan verme** | Telegram, Viber, WhatsApp, Web |
| **Otomatik yayın** | Telegram, Viber, WhatsApp, Instagram, Web |

Instagram'dan ilan **verilemez** — sadece onay sonrası otomatik feed yayını.

### Çoklu Proje

Tek admin altında birden fazla vertical: Horeca, İş İlanları, Araba vb. Her projenin kendi kategorileri, kanalları, fiyatları ve moderatörleri.

---

## 2. Sistem Mimarisi

```
Kullanıcı (TG/VB/WA/Site)
        ↓
   NestJS API ← Pricing Engine
        ↓
   Moderasyon (Admin)
        ↓
   BullMQ Worker → Telegram / Viber / WhatsApp / Instagram / Site
```

### Docker Servisleri

| Servis | Görev |
|--------|-------|
| nginx | Reverse proxy, SSL |
| api | NestJS REST + webhooks |
| admin | React moderatör paneli |
| web | Next.js public site |
| bot-telegram / bot-viber / bot-whatsapp | İlan verme botları |
| worker | Kanal yayın kuyruğu |
| postgres | Ana DB |
| redis | Kuyruk + cache + bot session |
| minio | Medya depolama |

---

## 3. Uçtan Uca Akış

### Admin Kurulumu
1. Proje oluştur (slug, kategori)
2. İlan verme + yayın kanallarını aç
3. Fiyat planı ve ödeme yöntemleri (Monopay, LiqPay, havale)
4. Moderatör ata, bot token ve kanal ID gir

### İlan Verme (Bot State Machine)
1. `SELECT_PROJECT` → 2. `SELECT_CATEGORY` → 3. `SELECT_CITY`
4. `ADD_POSITIONS` → 5. `ENTER_DETAILS` → 6. `UPLOAD_MEDIA`
7. `CONFIRM_PREVIEW` → 8. `PAYMENT` (gerekirse) → 9. `SUBMITTED`

### Moderasyon → Yayın
- Moderatör onaylar → worker paralel yayın
- Bir kanal hata verse diğerleri devam eder
- Kullanıcıya bot ile bildirim (Ukraynaca)

### Listing Durumları
`draft` → `pending_payment` / `pending_moderation` → `approved` → `publishing` → `published`

---

## 4. Ödeme (Ukrayna)

| Yöntem | Açıklama |
|--------|----------|
| **Monopay** | Kart ödemeleri, webhook onay |
| **LiqPay** | PrivatBank, redirect + callback |
| **Banka havalesi** | Referans kodu `ILAN-{id}-{rand}`, admin manuel onay, 24s timeout |

Fiyat önceliği: Abonelik kotası → Ücretsiz aylık kota → Tek ilan ücreti

---

## 5. Özellikler

### 5.1 Şehir Filtreleri (Faz 6)
- Oblast → Şehir hiyerarşisi (Kyiv, Lviv, Odesa + 5 şehir)
- Web: `/horeca/kyiv/ogoloshennya`
- Bot: `SELECT_CITY` adımı
- Kanal–şehir eşlemesi (şehir bazlı Telegram kanalı)

### 5.2 Abonelik Paketleri (Faz 6)

| Paket | Fiyat/ay | Kota |
|-------|----------|------|
| Стартовий | 299 ₴ | 5 ilan |
| Бізнес | 699 ₴ | 15 ilan |
| Преміум | 1499 ₴ | 50 ilan |
| Корпоративний | 3999 ₴ | 200 ilan |

### 5.3 VIP İlan ve Sabitleme (Faz 7)

| Boost | Fiyat | Süre |
|-------|-------|------|
| VIP badge | +99 ₴ | 7 gün |
| Sabitleme (Pin) | +199 ₴ | 3 gün |
| Öne çıkarma | +149 ₴ | 5 gün |
| Kombo | +349 ₴ | 7 gün |

Sıralama: Pin → boostScore → publishedAt

### 5.4 Analitik Dashboard (Faz 7)
- Kanal bazlı görüntülenme, tıklama, dönüşüm
- Gelir: ilan / boost / abonelik / havale kırılımı
- Recharts grafikleri, proje karşılaştırma

### 5.5 Kullanıcı Hesabı (Faz 7)
- Web: `/account/listings`
- Bot: `/my_ads` + **Опублікувати знову** (tekrar yayınla)
- Tüm kanallar tek `User` kaydına bağlanır

---

## 6. UI/UX Standartları (Zorunlu)

### Web
- Next.js 15 + Tailwind + shadcn/ui + Framer Motion
- OLX.ua / Work.ua kalitesinde tasarım
- Lighthouse **90+**, mobil-first
- İlan wizard, skeleton loading, VIP vurgulu kartlar

### Botlar
- Yanıt **< 1 saniye**, typing indicator
- Inline keyboard, emoji, "Крок 3 з 7" ilerleme
- Redis session 24s, `/continue` ile devam
- Prod'da webhook modu (polling yasak)

---

## 7. Veritabanı

**Karar:** PostgreSQL 16 + Drizzle ORM (`packages/database`)

### Temel Entity'ler
- Project, Category, Region, City
- Listing, ListingPosition, ListingMedia, ListingBoost
- User, UserSubscription, SubscriptionPlan
- ChannelConfig, ChannelPublication, ProjectChannelCity
- Payment, ModerationLog
- AnalyticsEvent, DailyStats

---

## 8. Klasör Yapısı

```
ilanhub/
├── apps/
│   ├── api/           # NestJS
│   ├── admin/         # React + Vite
│   ├── web/           # Next.js 15
│   ├── bot-telegram/
│   ├── bot-viber/
│   ├── bot-whatsapp/
│   └── worker/
├── packages/
│   ├── shared/
│   ├── database/
│   ├── pricing/
│   ├── payments/
│   ├── i18n/
│   ├── ui/
│   └── analytics/
├── docker/
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## 9. Geliştirme Fazları

| Faz | Hafta | İçerik |
|-----|-------|--------|
| 1 | 1-2 | Altyapı, UI temeli, DB schema |
| 2 | 2-3 | Moderasyon, Telegram bot, worker |
| 3 | 3-4 | Viber + WhatsApp |
| 4 | 4-5 | Instagram yayını + ödeme |
| 5 | 5-6 | Prod Docker, CI/CD, E2E |
| 6 | 7-9 | Şehir filtreleri + abonelik |
| 7 | 10-12 | VIP, analitik, kullanıcı hesabı |

---

## 10. Meta Ön Koşulları (Paralel Başlat)

1. Meta Business Suite hesabı
2. WhatsApp Business Cloud API
3. Instagram Business + Facebook Page
4. Telegram @BotFather bot + kanal admin
5. Viber Public Account

---

## 11. Riskler

| Risk | Çözüm |
|------|-------|
| Meta onay gecikmesi | TG + Web soft launch |
| Yavaş bot | Webhook + Redis + typing indicator |
| Sıradan UI | shadcn/ui + Lighthouse 90+ |
| Havale sahteciliği | Referans kodu + manuel kontrol |
| Instagram post hatası | Diğer kanallar devam eder |

---

## 12. Yapılacaklar

- [x] ORM/DB: PostgreSQL + Drizzle
- [x] Monorepo scaffold
- [x] Docker Compose dev
- [x] API core modülleri
- [x] Premium web UI (iskelet)
- [x] Telegram bot (iskelet)
- [x] Viber + WhatsApp botları (iskelet)
- [ ] Instagram yayın
- [ ] Monopay + LiqPay + havale (entegrasyon)
- [ ] Şehir filtreleri
- [ ] Abonelik paketleri
- [ ] VIP boost
- [ ] Analitik dashboard
- [ ] Kullanıcı hesabı + tekrar yayınla
