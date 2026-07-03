# Mobil Push (FCM) — Durum: KURULDU ✅ (2026-07-03)

- Firebase projesi: **`anadolu-borsa-ab12d`** — web + mobil + scraper aynı projede.
- `mobile/android/app/google-services.json` bu projenin Android kaydı
  (`com.anadoluborsa.mobile`). Gönderim anahtarı: GitHub Secret
  `GOOGLE_SERVICE_ACCOUNT_JSON` (PART5'ten beri kurulu).
- Günlük özet: mobil Ayarlar → Bildirimler → "Günlük fiyat özeti" anahtarı
  cihazı `gunluk_ozet` KONUSUNA abone eder (hesap gerektirmez);
  `scraper/alarm.py:gunluk_ozet_gonder` her koşuda tek bildirim atar.
- Hızlı test: telefonda anahtarı aç → GitHub → Actions → scraper → Run
  workflow → 1-2 dk içinde bildirim gelmeli.
- Not: `anadolu-borsa-2447e` projesi yanlışlıkla açılmıştı, kullanılmıyor —
  Firebase konsolundan silinebilir.

## v1.4'te sıradaki: kişisel fiyat alarmı (mobil)
"Arpa 15'i geçince haber ver" — web'de var; alarm kaydı hesaba bağlı (RLS)
olduğundan mobilde Google girişi gerektirir. O da Android için OAuth SHA-1
ayarı ister; günlük özet oturunca kurarız.
