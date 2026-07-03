# Mobil Push (FCM) — Tek Eksik Adım

## Durum (2026-07-03)
- Web push **zaten çalışıyor**: Firebase projesi **`anadolu-borsa-ab12d`**
  (web/src/lib/firebase.ts oradan config'li) + GitHub Secret
  `GOOGLE_SERVICE_ACCOUNT_JSON` kurulu (PART5'te yaptın, alarm push canlı).
- Mobil v1.3 kodu bağlandı: günlük özet bildirimi (Ayarlar → Bildirimler),
  scraper her akşam `gunluk_ozet` konusuna tek bildirim atıyor.
- ⚠ Verdiğin `google-services (6).json` **yeni bir projeden** (`anadolu-borsa-2447e`).
  FCM token'ları proje-bazlıdır: scraper ab12d anahtarıyla gönderdiği için
  2447e'ye kayıtlı telefona bildirim ULAŞMAZ. (Önceki talimatım "yeni proje aç"
  dediği için oldu — benim hatam.)

## Yapılacak tek şey (~3 dk)
1. https://console.firebase.google.com → **anadolu-borsa-ab12d** projesini aç
   (web'in kullandığı proje; listede görünüyor olmalı)
2. ⚙ Project settings → **Your apps** → **Add app** → **Android**
3. Package name: `com.anadoluborsa.mobile` → Register
4. İnen **google-services.json**'u bana ver → `mobile/android/app/`e koyup
   APK'yı yeniden derlerim. Bitti — başka hiçbir şey gerekmiyor
   (secret zaten var, scraper kodu hazır).

İstersen `anadolu-borsa-2447e` projesini Firebase konsolundan silebilirsin
(kullanılmayacak).

## v1.4'te sıradaki: kişisel fiyat alarmı (mobil)
"Arpa 15'i geçince haber ver" — web'de var; alarm kaydı hesaba bağlı (RLS)
olduğundan mobilde Google girişi gerektirir. O da Android için OAuth SHA-1
ayarı ister; günlük özet oturunca kurarız.
