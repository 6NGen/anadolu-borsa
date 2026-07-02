# v1.3 Push Bildirim (FCM) — Kurulum Adımları (SENİN yapman gerekenler)

Push alarm + günlük fiyat özeti bildirimi için Firebase projesi gerekiyor.
Aşağıdakileri yapıp çıkan **2 dosyayı** bana ver, gerisini ben bağlarım.

## 1. Firebase projesi aç (~10 dk, ücretsiz)
1. https://console.firebase.google.com → **Add project**
2. Ad: `anadolu-borsa` → Google Analytics **kapalı** (gerekmiyor) → Create

## 2. Android uygulamasını ekle
1. Proje açılınca **Android simgesine** tıkla (Add app)
2. **Android package name:** `com.anadoluborsa.mobile` (birebir bu olmalı)
3. Nickname: Anadolu Borsa (isteğe bağlı) → Register app
4. **google-services.json** dosyasını indir → bana ver
   (konumu ben ayarlayacağım: `mobile/android/app/google-services.json`)

## 3. Sunucu anahtarı (scraper'ın bildirim atabilmesi için)
1. Firebase Console → ⚙ **Project settings** → **Service accounts** sekmesi
2. **Generate new private key** → inen `.json` dosyasını sakla
3. GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**
   - Name: `FCM_SERVICE_ACCOUNT`
   - Value: o json dosyasının İÇERİĞİ (tamamını yapıştır)

## 4. Bana haber ver
İkisi tamamlanınca ben:
- `firebase_messaging` paketini bağlarım (izin isteme + token kaydı → Supabase `profil`)
- `scraper/alarm.py`'yi FCM'e bağlarım (alarm tetiklenince telefona push)
- Günlük özet bildirimini eklerim (scraper bitince "Bugün: Buğday 12,00 ▲%2 …")
- Ayarlar'a "Bildirimler" bölümü eklerim (alarm aç/kapat, günlük özet aç/kapat)

## Notlar
- Ücretsiz plan (Spark) push için fazlasıyla yeter; kart bilgisi istemez.
- `google-services.json` gizli sayılmaz ama yine de repo'ya commit edilecek
  (standart uygulama böyledir; API anahtarı Android imzasıyla kısıtlanır).
- Service account json'u ise GİZLİDİR — sadece GitHub Secret'a koy, bana
  chat'te yapıştırma, repo'ya ekleme.
