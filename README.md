# İlanHub

[![GitHub](https://img.shields.io/github/stars/kadobey003/ilanhub?style=social)](https://github.com/kadobey003/ilanhub)

Ukrayna pazarı için çok kanallı ilan platformu.

**GitHub:** [kadobey003/ilanhub](https://github.com/kadobey003/ilanhub)  
**Prozone:** [kadir/ilanhub](https://git.prozone.dev/kadir/ilanhub)

## Özet

- **İlan verme:** Telegram, Viber, WhatsApp, Web
- **Otomatik yayın:** Telegram, Viber, WhatsApp, Instagram, Web
- **Dil:** Ukraynaca (`uk`)
- **Para birimi:** UAH (₴)
- **Ödeme:** Monopay, LiqPay, banka havalesi
- **Stack:** NestJS, Next.js, React Admin, Docker, Redis, PostgreSQL

## Projeler (örnek)

Horeca, İş İlanları, Araba Satışları — tek admin çatısı altında çoklu vertical.

## Akış

1. Kullanıcı bot veya siteden ilan verir
2. Moderatör onaylar
3. Sistem tüm aktif kanallara otomatik yayınlar

## Dokümantasyon

Detaylı mimari plan: [docs/PLAN.md](docs/PLAN.md)

## Geliştirme Fazları

| Faz | İçerik |
|-----|--------|
| 1 | Altyapı + UI temeli |
| 2 | Moderasyon + Telegram bot |
| 3 | Viber + WhatsApp |
| 4 | Instagram yayını + ödeme |
| 5 | Prod hazırlık |
| 6 | Şehir filtreleri + abonelik |
| 7 | VIP, analitik, kullanıcı hesabı |

## Karar Bekleyen

- **Kenan:** ORM / veritabanı seçimi (Drizzle, TypeORM, Supabase, MongoDB)

## Kurulum

```bash
cp .env.example .env
docker compose up -d
```

> Kod henüz scaffold aşamasında değil — şu an sadece plan reposu.
