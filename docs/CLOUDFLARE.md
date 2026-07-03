# Cloudflare Domain Kurulumu (Tünelsiz)

Bu rehber domain’i **Cloudflare DNS + Proxy** ile VPS’e bağlar.  
**Cloudflare Tunnel kullanılmaz.** Trafik: `Kullanıcı → Cloudflare (HTTPS) → VPS IP (HTTP/HTTPS)`.

| Bilgi | Değer |
|--------|--------|
| VPS IPv4 | `51.77.215.204` |
| VPS hostname | `vps-aa935e98.vps.ovh.net` |
| Site (şimdilik) | http://51.77.215.204 |
| Admin | http://51.77.215.204/admin/ |

Aşağıda `ornek.com` yazan yerlere **kendi domain’ini** yaz.

---

## 1. Domain al

Herhangi bir registrar’dan domain al (Namecheap, Cloudflare Registrar, GoDaddy, vb.).

Örnek: `ornek.com`

---

## 2. Cloudflare hesabı ve site ekle

1. [https://dash.cloudflare.com](https://dash.cloudflare.com) → kayıt / giriş.
2. **Add a domain** / **Add a site**.
3. Domain’i yaz: `ornek.com`.
4. Plan: **Free** yeterli.
5. Cloudflare DNS kayıtlarını tarar; şimdilik devam et.

---

## 3. Nameserver’ları domain sağlayıcıya yaz

Cloudflare sana 2 nameserver verir, örnek:

```text
ada.ns.cloudflare.com
bob.ns.cloudflare.com
```

1. Domain’i aldığın panelde **Nameservers / DNS** bölümüne gir.
2. Varsayılan NS’leri sil, Cloudflare’inkileri yaz.
3. Kaydet.

**Bekleme:** 5 dakika – 24 saat (çoğu zaman 30 dk içinde).  
Cloudflare’da domain durumu **Active** olmalı.

Kontrol: [https://www.whatsmydns.net](https://www.whatsmydns.net) → NS sorgusu.

---

## 4. DNS kayıtları (A record)

Cloudflare → domain → **DNS** → **Records**:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| A | `@` | `51.77.215.204` | **Proxied** (turuncu bulut) |
| A | `www` | `51.77.215.204` | **Proxied** (turuncu bulut) |

- **Proxied (turuncu)** = ziyaretçi Cloudflare üzerinden gelir, ücretsiz HTTPS alır.
- **DNS only (gri)** = doğrudan VPS IP; Cloudflare SSL çalışmaz.

Kaydet. Birkaç dakika bekle, sonra tarayıcıda dene:

```text
http://ornek.com
```

(SSL ayarı yapılmadan önce tarayıcı uyarı verebilir; adım 5’te düzelir.)

---

## 5. SSL/TLS (tünelsiz, önerilen: Flexible)

Cloudflare → **SSL/TLS** → **Overview**:

1. Encryption mode: **Flexible** seç.

Bu modda:

- Ziyaretçi ↔ Cloudflare: **HTTPS**
- Cloudflare ↔ VPS: **HTTP (port 80)**

VPS’te ekstra sertifika gerekmez; mevcut nginx (port 80) yeterli.

### Opsiyonel: Full (daha güvenli)

İleride origin’de de HTTPS istersen:

1. Cloudflare → **SSL/TLS** → **Origin Server** → **Create Certificate**.
2. Hostnames: `ornek.com`, `*.ornek.com`.
3. **Origin Certificate** + **Private Key** indir.
4. VPS’te:

```bash
ssh ubuntu@51.77.215.204
sudo mkdir -p ~/ilanhub/docker/nginx/ssl
# cert ve key dosyalarını koy:
#   docker/nginx/ssl/cert.pem
#   docker/nginx/ssl/key.pem
```

5. nginx’e `listen 443 ssl` eklenir (ayrı PR / güncelleme gerekir).
6. Cloudflare SSL mode: **Full** (Strict değil, origin cert self-signed benzeri olabilir; Cloudflare origin cert için **Full** yeterli).

**İlk kurulum için Flexible yeter.** Telegram webhook HTTPS’i Cloudflare sağlar.

---

## 6. Cloudflare ek ayarlar (önerilen)

**SSL/TLS → Edge Certificates**

- Always Use HTTPS: **On**
- Automatic HTTPS Rewrites: **On**
- Minimum TLS Version: **1.2**

**Security → Settings** (isteğe bağlı)

- Security Level: Medium

**Caching**

- İlk günlerde sorun yaşarsan: **Caching → Configuration → Purge Everything**

---

## 7. VPS’te PUBLIC_URL güncelle

Domain aktif olduktan sonra VPS’e bağlan:

```bash
ssh ubuntu@51.77.215.204
cd ~/ilanhub
nano .env
```

Şunları ayarla (domain’ine göre):

```env
PUBLIC_URL=https://ornek.com
```

Varsa `docker-compose.override.yml` içinde de `PUBLIC_URL` satırlarını aynı yap:

```bash
nano docker-compose.override.yml
```

Örnek:

```yaml
services:
  api:
    environment:
      PUBLIC_URL: https://ornek.com
      BOT_INTERNAL_SECRET: <mevcut-değer-aynı-kalsın>
  worker:
    environment:
      PUBLIC_URL: https://ornek.com
  bot-telegram:
    environment:
      PUBLIC_URL: https://ornek.com
      BOT_INTERNAL_SECRET: <mevcut-değer-aynı-kalsın>
```

Servisleri yeniden başlat:

```bash
cd ~/ilanhub
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d api worker bot-telegram web nginx
```

Kontrol:

```bash
curl -s https://ornek.com/api/health
```

Beklenen: `{"status":"ok",...}`

---

## 8. Admin ve Telegram webhook

### Admin

```text
https://ornek.com/admin/
```

Giriş (varsayılan):

- Email: `admin@ilanhub.local`
- Şifre: `admin123`

### Telegram bot token (panelden)

1. https://ornek.com/admin/telegram
2. Proje seç (Horeca / Робота / Авто).
3. **Bot Token** yapıştır (`@BotFather`’dan).
4. **Webhook URL** otomatik olmalı:

```text
https://ornek.com/webhooks/telegram
```

5. **Зберегти** (Kaydet) — token DB’ye yazılır, bot reload olur.
6. HTTPS olduğu için webhook da kurulur.

`.env` içine `TELEGRAM_BOT_TOKEN` yazmana gerek yok.

---

## 9. Kontrol listesi

| Adım | Kontrol |
|------|---------|
| NS Active | Cloudflare’da domain Active |
| A kaydı | `@` → `51.77.215.204`, Proxied |
| SSL | Flexible + Always HTTPS On |
| Site | `https://ornek.com` açılıyor |
| API | `https://ornek.com/api/health` → ok |
| Admin | `https://ornek.com/admin/` logo + projeler |
| Telegram | Panelden token + webhook HTTPS |

---

## 10. Sık sorunlar

### Site açılmıyor

- NS henüz yayılmamış olabilir (bekle / whatsmydns).
- A kaydı IP doğru mu: `51.77.215.204`
- Proxy **turuncu** mu?

### ERR_TOO_MANY_REDIRECTS

- SSL mode **Flexible** olmalı (origin sadece HTTP iken **Full** redirect döngüsü yapar).
- VPS’te nginx’in 80’i dinlediğinden emin ol.

### Admin boş / logo yok

- Hard refresh: `Ctrl+F5`
- Cloudflare cache purge.

### Telegram webhook hata

- URL mutlaka `https://.../webhooks/telegram`
- `PUBLIC_URL=https://ornek.com` kaydedilip api/bot restart edilmiş olmalı
- Token doğru mu (`getMe` hatası = yanlış token)

### Eski IP ile erişim

IP (`http://51.77.215.204`) çalışmaya devam eder; asıl adres domain olsun.

---

## Özet akış

```text
1. Domain al
2. Cloudflare’a ekle
3. Nameserver’ları registrar’da Cloudflare yap
4. A @ ve www → 51.77.215.204 (Proxied)
5. SSL = Flexible, Always HTTPS = On
6. VPS .env → PUBLIC_URL=https://ornek.com
7. docker compose up -d (api, worker, bot, web, nginx)
8. Admin → Telegram → token kaydet
```

Domain’i aldığında isim yazman yeterli; VPS tarafındaki `PUBLIC_URL` güncellemesini birlikte de yapabiliriz.
