# SEO Planı — UAREKLAMHUB (Ukrayna)

**Hedef:** Ukrayna genelinde iş arayanlar, Horeca işverenleri ve Telegram/Viber/WhatsApp üzerinden ilan verenler için organik aramalarda öne çıkmak.

**Marka:** UAREKLAMHUB  
**Dil:** Ukraynaca (`uk`)  
**Ana vertical'lar:** Робота (jobs), Horeca, Авто

---

## 1. Mevcut Durum Özeti

### ✅ İyi olanlar

| Alan | Durum |
|------|--------|
| `lang="uk"` | `layout.tsx` — doğru |
| Title template | `%s \| UAREKLAMHUB` |
| Sayfa bazlı metadata | Çoğu landing/listing sayfasında var |
| Listing OG/Twitter | `generateMetadata` + görsel |
| PWA manifest | `manifest.ts` |
| Breadcrumb (UI) | `ListingBreadcrumb` — şema yok |
| H1 yapısı | Hero ve ListingsPageLayout'ta mevcut |
| Cyrillic font | Plus Jakarta Sans `cyrillic-ext` |
| İç linkleme | Footer, vertical kartlar, cross-link (robota↔horeca) |
| Telegram banner | Kanal + bot linkleri listing sayfalarında |
| SSR | Next.js App Router — içerik sunucuda render |

### ❌ Kritik eksikler

| Alan | Risk |
|------|------|
| `sitemap.xml` | Yok — Google sayfaları keşfedemiyor |
| `robots.txt` | Yok |
| `metadataBase` / canonical | Yok — duplicate URL riski |
| JSON-LD (Schema.org) | Yok — JobPosting, Organization, BreadcrumbList |
| Open Graph (genel) | Sadece listing detayda; landing'lerde yok |
| Google Analytics / GSC | Entegrasyon yok |
| `noindex` (private sayfalar) | login, register, account indekslenebilir |
| Şehir URL tutarsızlığı | Jobs: `/jobs/kyiv/ogoloshennya` — Horeca: `/horeca/ogoloshennya?city=kyiv` |
| Duplicate landing | `/robota` ≈ `/jobs` — aynı niş, farklı URL |
| Ana sayfa metadata | `page.tsx` özel title/description export etmiyor |
| İçerik/blog | Yok — long-tail keyword için zayıf |
| Şehir kapsamı | Sadece 6 şehir (Київ, Львів, Одеса, Харків, Дніпро, Запоріжжя) |
| Viber/WhatsApp SEO | Footer ve metadata'da zayıf |
| `og:url`, `twitter:site` | Tanımlı değil |

---

## 2. URL Yapısı ve Canonical Stratejisi

### Mevcut URL haritası

```
/                          → Ana landing
/robota                    → İş arayan landing
/robota/employer           → İşveren landing
/jobs                      → İş ilanları hub (robota ile overlap)
/jobs/{city}/ogoloshennya  → Şehir bazlı iş ilanları ✅ SEO-friendly
/horeca                    → Horeca landing
/horeca/ogoloshennya       → Tüm Horeca vakansiyaları
/horeca/ogoloshennya?city= → Şehir filtresi (query — SEO zayıf)
/horeca/prodazh            → Horeca ekipman satışı
/{project}/listing/{id}    → İlan detay
/login, /register, /account, /create → Private/utility
```

### Önerilen canonical kuralları

| Canonical URL | Redirect / noindex |
|---------------|-------------------|
| `/jobs` | `/robota` → 301 `/jobs` VEYA tam tersi — **birini seç** |
| `/horeca/ogoloshennya?city=kyiv` | 301 → `/horeca/kyiv/ogoloshennya` |
| `/jobs/ogoloshennya` | Mevcut `[project]/ogoloshennya` route'u kullan |
| `/account/*`, `/login`, `/register`, `/create` | `robots: noindex, follow` |
| Trailing slash | Tek format (slash'sız) — middleware ile zorla |

**Öneri:** Marketing URL'leri Ukraynaca tut (`/robota`, `/horeca`), listing browse URL'leri İngilizce slug (`/jobs/kyiv/ogoloshennya`) — ama **her çift için tek canonical** belirle.

---

## 3. Hedef Anahtar Kelimeler (Ukraynaca)

### Tier 1 — Yüksek hacim (öncelik)

| Keyword | Hedef sayfa |
|---------|-------------|
| робота україна | `/jobs` veya `/robota` |
| вакансії київ | `/jobs/kyiv/ogoloshennya` |
| робота київ | `/jobs/kyiv/ogoloshennya` |
| вакансії львів | `/jobs/lviv/ogoloshennya` |
| horeca вакансії | `/horeca/ogoloshennya` |
| робота в ресторані | `/horeca` |
| вакансії офіціант | `/horeca/ogoloshennya` |
| вакансії кухар | `/horeca/ogoloshennya` |

### Tier 2 — İşveren + kanal

| Keyword | Hedef sayfa |
|---------|-------------|
| подати вакансію | `/robota/employer`, `/create` |
| вакансії telegram | Ana sayfa + `/jobs` |
| робота telegram бот | Ana sayfa |
| знайти працівників | `/robota/employer` |
| вакансії viber | Ana sayfa |

### Tier 3 — Long-tail (blog/landing ile)

- робота без досвіду київ
- сезонна робота одеса
- вакансії бармен київ
- робота в готелі львів
- продаж обладнання для ресторану

### Tier 4 — Horeca ekipman

- б/в обладнання для ресторану
- продаж кавомашини київ
- холодильник для кафе

---

## 4. Teknik SEO — Yapılacaklar

### Faz 1 — Kritik (1–2 hafta)

#### 4.1 `metadataBase` ve canonical

```ts
// apps/web/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://uareklamhub.com"),
  alternates: { canonical: "/" },
  // ...
};
```

Her sayfada `alternates.canonical` — tam URL.

#### 4.2 `robots.ts`

```ts
// apps/web/app/robots.ts
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/account/", "/login", "/register", "/create"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

#### 4.3 `sitemap.ts` (dinamik)

Dahil edilecekler:
- Statik landing'ler (`/`, `/robota`, `/jobs`, `/horeca`, `/avto`, employer sayfaları)
- Şehir sayfaları: `jobs` + `horeca` × tüm şehirler
- Aktif listing'ler: API'den `fetchProjectListings` ile ID'ler
- `lastmod`: listing `publishedAt`
- `changefreq`: listing=günlük, landing=haftalık
- `priority`: ana=1.0, şehir=0.8, listing=0.6

#### 4.4 JSON-LD şemaları

| Sayfa | Schema |
|-------|--------|
| Ana sayfa | `WebSite` + `SearchAction` |
| Tüm site | `Organization` (logo, sosyal, iletişim) |
| İlan detay (vakansiya) | `JobPosting` (title, datePosted, hiringOrganization, jobLocation, baseSalary) |
| Breadcrumb | `BreadcrumbList` |
| Şehir listing | `ItemList` |
| Horeca ekipman | `Product` veya `Offer` |

Örnek JobPosting alanları (listing detay):
- `title`, `description`, `datePosted`, `validThrough`
- `hiringOrganization.name`
- `jobLocation.addressLocality` (şehir)
- `baseSalary` (varsa)
- `employmentType`
- `applicationContact` (telefon — dikkatli, spam riski)

#### 4.5 Open Graph tamamlama

Tüm public sayfalara:
```ts
openGraph: {
  type: "website",
  locale: "uk_UA",
  siteName: "UAREKLAMHUB",
  url: canonicalUrl,
  images: [{ url: "/og-default.png", width: 1200, height: 630 }],
},
twitter: { card: "summary_large_image", site: "@..." },
```

`/public/og-default.png` — marka + "Робота · Horeca · Telegram" görseli.

#### 4.6 Private sayfalar — noindex

`login`, `register`, `account/*`, `create` → `robots: { index: false, follow: true }`

---

### Faz 2 — URL ve içerik (2–4 hafta)

#### 4.7 Horeca şehir URL'leri

Mevcut: `/horeca/ogoloshennya?city=kyiv`  
Hedef: `/horeca/kyiv/ogoloshennya` (jobs ile aynı pattern)

- `[project]/[city]/ogoloshennya` route'u zaten var — Horeca için de kullan
- Query param → 301 redirect
- `horeca/ogoloshennya/page.tsx` → tüm Ukrayna listesi (şehir yok)

#### 4.8 `/robota` vs `/jobs` birleştirme

**Seçenek A (önerilen):**
- `/robota` = marketing landing (index)
- `/jobs` = listing hub (index)
- Farklı içerik, farklı title — duplicate değil
- Cross-canonical **kullanma**

**Seçenek B:**
- `/robota` → 301 `/jobs`
- Marketing mesajını `/jobs` sayfasına taşı

#### 4.9 Şehir genişletme

Öncelikli eklenecek şehirler:
Вінниця, Полтава, Чернівці, Івано-Франківськ, Тернопіль, Ужгород, Миколаїв, Херсон, Кривий Ріг, Черкаси, Суми, Житомир, Рівне, Кременчук, Кам'янське

Her şehir için:
- `/jobs/{slug}/ogoloshennya`
- `/horeca/{slug}/ogoloshennya`
- Unique H1: `Вакансії — {місто}`
- Unique meta description (şehir adı + vertical)

#### 4.10 Ana sayfa metadata

```ts
export const metadata: Metadata = {
  title: "UAREKLAMHUB — Робота, Horeca та оголошення в Україні",
  description: "Вакансії по всій Україні. Подайте оголошення через Telegram, Viber, WhatsApp або сайт. Horeca, офіс, IT, авто.",
};
```

#### 4.11 Rol/kategori landing sayfaları (yeni)

SEO için programatik sayfalar:
- `/horeca/vakansiyi/kuhar` (кухар)
- `/horeca/vakansiyi/oficiant` (офіціант)
- `/horeca/vakansiyi/barmen`
- `/jobs/kategoriya/it`
- `/jobs/kategoriya/sklad`

Her sayfa: filtrelenmiş listing listesi + 200–400 kelime Ukraynaca açıklama.

---

### Faz 3 — Performans ve izleme (sürekli)

#### 4.12 Core Web Vitals

- Listing görselleri: `next/image` + WebP
- `next.config.mjs`: `images.remotePatterns` (MinIO/CDN domain)
- Font: `display: swap` ✅ (mevcut)
- Lazy load: listing kartları below-fold

#### 4.13 Analytics

| Araç | Amaç |
|------|------|
| Google Search Console | İndeks, sorgular, hatalar |
| Google Analytics 4 | Trafik, dönüşüm |
| Yandex Metrica | Ukrayna/RU kullanıcı segmenti (opsiyonel) |

Env: `NEXT_PUBLIC_GA_ID`, GSC doğrulama meta tag.

#### 4.14 Middleware

```ts
// www → non-www 301
// http → https 301 (Cloudflare'de de yapılabilir)
// trailing slash kaldır
// eski URL redirect'leri
```

---

## 5. On-Page SEO — Sayfa Bazlı

### Ana sayfa `/`

| Öğe | Öneri |
|-----|-------|
| Title | `UAREKLAMHUB — Робота та вакансії в Україні \| Telegram, Viber` |
| H1 | Mevcut Hero — keyword ekle: "вакансії" |
| İçerik | Telegram showcase üstte ✅; FAQ bölümü ekle (schema: FAQPage) |
| CTA | Bot linkleri görünür |

### `/robota` (iş arayan)

| Öğe | Öneri |
|-----|-------|
| Title | `Шукаю роботу в Україні — вакансії по містах` |
| Description | Şehir isimleri + "Telegram бот" |
| H1 | `Знайдіть роботу у своєму місті` ✅ |

### `/robota/employer` (işveren)

| Öğe | Öneri |
|-----|-------|
| Title | `Подати вакансію в Україні — Telegram, Viber, WhatsApp` |
| Description | "Знайти працівників швидко", fiyat bilgisi |
| H1 | `Знайдіть працівників` ✅ |
| CTA | `/create?project=jobs` prominent |

### `/horeca`

| Öğe | Öneri |
|-----|-------|
| Title | `Horeca вакансії Україна — ресторани, кафе, готелі` |
| Description | Rol isimleri: кухар, офіціант, бармен |
| İçerik | Rol chip'leri link olmalı (şu an sadece span) |

### `/horeca/ogoloshennya`

| Öğe | Öneri |
|-----|-------|
| Title | `Horeca вакансії — {місто або Україна}` |
| H1 | `Horeca — {місто}` ✅ |

### İlan detay `/{project}/listing/{id}`

| Öğe | Öneri |
|-----|-------|
| Title | `{İlan başlığı} — {şehir} \| UAREKLAMHUB` |
| Description | İlk 155 karakter — maaş, rol, şehir |
| OG image | Listing foto ✅ |
| Schema | JobPosting |
| İç link | Related listings ✅ |

---

## 6. Telegram / Viber / WhatsApp — Off-Page SEO

Site SEO'su kadar önemli — Ukrayna'da iş ilanları çoğunlukla messenger'da aranıyor.

### Telegram

| Aksiyon | Detay |
|---------|-------|
| Kanal adı | Keyword: `@uareklamhub_kyiv_jobs`, `@horeca_vakansiyi_ua` |
| Kanal açıklaması | 2–3 cümle + site linki + şehir |
| Pin mesajı | Site + bot linki |
| Bio link | `t.me/...` → site landing (deep link) |
| Siteden kanala | `rel="noopener"` ✅ — `rel="me"` eklenebilir |
| Bot `/start` | UTM: `?start=web_seo` |

### Viber / WhatsApp

- Footer'a bot deep link ekle (şu an sadece metadata'da geçiyor)
- `/viber` veya ana sayfada "Viber бот" butonu
- QR kod — işveren landing'de

### Sosyal sinyal

- Instagram bio → site
- Facebook sayfası (Ukrayna iş grupları)
- OLX/Work.ua'dan farklılaşma: "Telegram + site senkron"

---

## 7. İçerik Stratejisi

### Blog / rehber ( `/blog` veya `/guide` )

Aylık 4–8 makale, Ukraynaca:

1. "Як знайти роботу в Києві через Telegram у 2026"
2. "Вакансії Horeca: скільки заробляє офіціант"
3. "Як подати вакансію безкоштовно — покрокова інструкція"
4. "Робота для студентів: ТОП-10 вакансій"
5. "Чим відрізняється Horeca від загальної роботи"

Her makale: 800–1500 kelime, internal link, CTA bot/site.

### FAQ (ana sayfa + vertical landing)

Schema: `FAQPage` — Google rich snippet.

Örnek sorular:
- Чи безкоштовно подати вакансію?
- Як швидко знаходять кандидатів?
- Чим Horeca відрізняється від Роботи?

---

## 8. Rakip Analizi (Ukrayna)

| Rakip | Güçlü | Zayıf | Fırsat |
|-------|-------|-------|--------|
| Work.ua | Domain authority, marka | Horeca niş zayıf | Horeca + Telegram odaklı niş |
| Robota.ua | İş ilanı hacmi | Messenger entegrasyonu zayıf | Bot + çok kanal |
| OLX | Trafik | İş ilanı UX kötü | İşveren odaklı UX |
| Telegram kanalları | Hız, güncellik | Arama/index yok | Site + kanal hibrit |

**Farklılaşma mesajı:** "Єдина платформа: сайт + Telegram + Viber + WhatsApp — одна вакансія, усі канали."

---

## 9. Uygulama Öncelik Sırası

### Hafta 1–2 (P0)

- [ ] `NEXT_PUBLIC_SITE_URL` env + `metadataBase`
- [ ] `robots.ts` + `sitemap.ts`
- [ ] Tüm public sayfalara OG image + canonical
- [ ] `noindex` — account/login/register/create
- [ ] Google Search Console + sitemap gönder
- [ ] GA4 kurulumu

### Hafta 3–4 (P1)

- [ ] JobPosting JSON-LD — listing detay
- [ ] Organization + WebSite schema — layout
- [ ] Horeca şehir URL: query → path + 301
- [ ] `/robota` vs `/jobs` kararı ve uygulama
- [ ] OG default görsel tasarımı
- [ ] Footer: Telegram + Viber + WhatsApp linkleri

### Ay 2 (P2)

- [ ] 10+ yeni şehir slug
- [ ] Rol/kategori programatik sayfalar
- [ ] FAQ bölümü + FAQPage schema
- [ ] `next/image` optimizasyonu
- [ ] Blog altyapısı (MDX veya CMS)

### Ay 3+ (P3)

- [ ] Aylık içerik takvimi
- [ ] A/B title/description testleri (GSC verisiyle)
- [ ] Backlink: Ukrayna iş forumları, Horeca dernekleri
- [ ] Yandex Metrica (opsiyonel)
- [ ] Hreflang — sadece `uk` yeterli; Rusça eklersen `ru` + `uk`

---

## 10. KPI'lar

| Metrik | 3 ay hedef | 6 ay hedef |
|--------|------------|------------|
| GSC indekslenen sayfa | 200+ | 1000+ |
| Organik tıklama/ay | 500 | 3000 |
| "вакансії київ" sıralama | Top 50 | Top 20 |
| "horeca вакансії" | Top 30 | Top 10 |
| Telegram kanal üye (organik) | +20%/ay | +15%/ay |
| İlan detay organik görüntüleme | 30% trafik | 50% trafik |

---

## 11. Kod Değişiklikleri — Dosya Listesi

| Dosya | Değişiklik |
|-------|------------|
| `apps/web/app/layout.tsx` | metadataBase, Organization schema |
| `apps/web/app/robots.ts` | Yeni |
| `apps/web/app/sitemap.ts` | Yeni — dinamik |
| `apps/web/app/page.tsx` | metadata export |
| `apps/web/middleware.ts` | Yeni — redirect, trailing slash |
| `apps/web/lib/seo.ts` | Yeni — canonical helper, JSON-LD builders |
| `apps/web/components/seo/JsonLd.tsx` | Yeni |
| `apps/web/app/[project]/listing/[id]/page.tsx` | JobPosting schema |
| `apps/web/app/horeca/ogoloshennya/page.tsx` | Şehir redirect |
| `apps/web/next.config.mjs` | images.remotePatterns |
| `apps/web/public/og-default.png` | Yeni |
| `.env.example` | NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_GA_ID |
| `apps/web/components/Footer.tsx` | Messenger linkleri |
| `apps/web/lib/cities.ts` | Şehir genişletme |

---

## 12. Hızlı Kontrol Listesi (Launch öncesi)

```
[ ] https://domain.com/robots.txt erişilebilir
[ ] https://domain.com/sitemap.xml erişilebilir
[ ] GSC'de domain doğrulandı
[ ] Ana sayfa rich results test (schema.org validator)
[ ] Mobile-friendly test geçti
[ ] PageSpeed Insights > 80 (mobile)
[ ] Tüm 404'ler custom not-found
[ ] Canonical çakışması yok (GSC → Pages → Duplicate)
[ ] SSL aktif (Cloudflare proxy)
[ ] www/non-www tek versiyon
```

---

*Son güncelleme: 2026-07-06 — Kod tabanı denetimi: apps/web Next.js 15*
