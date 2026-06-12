# Anadolu Borsa

Türkiye tarım ve hayvancılık fiyat platformu — [borsanadolu.6ngen.com](https://borsanadolu.6ngen.com)

- `web/` — Next.js sitesi (Vercel, push = deploy)
- `scraper/` — günlük veri çekici (GitHub Actions, her gün 23:00 TSİ): TOBB/KTB hububat, ESK karkas, USK çiğ süt, Open-Meteo hava

## Mazot fiyatı nasıl güncellenir

Mazot elle güncellenir (EPDK/pompa fiyatından). Tek komut:

```
python scraper/mazot_guncelle.py --fiyat 68,50
```

Onay sorar; aynı gün tekrar çalıştırmak değeri günceller. 14+ gün güncellenmezse /parite sayfası "fiyat eski olabilir" uyarısı gösterir.
