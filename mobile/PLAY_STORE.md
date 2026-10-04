# Google Play'e çıkış

Neden: çiftçi APK dosyası kurmaz ("bilinmeyen kaynak" izni, güvenlik uyarısı).
Play'de olmayan uygulama, dağıtılamayan uygulamadır.

## 1. Yükleme anahtarı (bir kez, ~5 dk — SENDE)

Şu an release APK'lar bu bilgisayardaki **debug** anahtarıyla imzalanıyor.
Play bunu kabul etmez; bilgisayar giderse güncelleme de gönderilemez.

Flutter'ın kendi JDK'sıyla (sistem Java 25 Gradle'la uyumsuz) anahtar üret.
Şifreyi sen seç; anahtar dosyasını ve şifreyi **parola yöneticisine + bulut yedeğe** koy:

```
"C:\Program Files\Android\Android Studio\jbr\bin\keytool" -genkey -v ^
  -keystore C:\Users\OMERFARUKDURNA\anadolu-yukleme.jks ^
  -keyalg RSA -keysize 2048 -validity 10000 -alias yukleme
```

(keytool o yolda yoksa: `flutter doctor -v` çıktısındaki "Java binary at" klasörü.)

Sonra `mobile/android/key.properties` oluştur (gitignore'da, commit'lenmez):

```
storePassword=<şifre>
keyPassword=<şifre>
keyAlias=yukleme
storeFile=C:/Users/OMERFARUKDURNA/anadolu-yukleme.jks
```

`build.gradle.kts` bu dosyayı görünce otomatik onunla imzalar; dosya yoksa eskisi
gibi debug anahtarı kullanılır.

**Firebase:** yeni anahtarın SHA-1'ini Firebase konsoluna ekle
(Proje ayarları → Android uygulaması → Parmak izi ekle). SHA-1:
`keytool -list -v -keystore C:\Users\OMERFARUKDURNA\anadolu-yukleme.jks -alias yukleme`
Play App Signing açılınca Play Console'daki "Uygulama imzalama anahtarı" SHA-1'ini de ekle.

**Mevcut APK kullanıcıları:** imza değiştiği için bir kez silip Play'den kurmaları gerekir.

## 2. Paket

```
cd mobile
flutter build appbundle --release
```
Çıktı: `build/app/outputs/bundle/release/app-release.aab` (Play AAB ister, APK değil).
Her yüklemede `pubspec.yaml` `version:` sonundaki `+N` artmalı (APK sürüm disiplini).

## 3. Play Console (SENDE)

1. play.google.com/console → geliştirici hesabı (tek seferlik 25 $, kimlik doğrulama birkaç gün sürebilir).
2. Uygulama oluştur → ad: **Anadolu Borsa** (avukat cevabından sonra isim değişirse ÖNCE onu bekle — Play'de isim değişikliği yeni giriş kadar zahmetli değil ama paket adı `com.anadoluborsa.mobile` kalıcıdır).
3. **Gizlilik politikası:** https://borsanadolu.6ngen.com/kvkk
4. **Veri güvenliği formu:** hesap yok; konum toplanmıyor (bölge elle seçiliyor); Çiftçi Defteri girişleri yalnız cihazda; bildirim için FCM cihaz kimliği (topic aboneliği) — "Cihaz veya diğer kimlikler: Toplanıyor, uygulama işlevi, paylaşılmıyor".
5. **İçerik derecelendirmesi** anketi, **hedef kitle** 18+.
6. Kişisel geliştirici hesaplarında üretime çıkmadan önce **kapalı test zorunlu**: en az 12 test kullanıcısı, 14 gün. Bu aslında fırsat: ilk 12 gerçek çiftçi = ilk geri bildirim grubu. E-posta adreslerini şimdiden topla.
7. Mağaza görselleri: ikon 512×512, öne çıkan grafik 1024×500, en az 2 telefon ekran görüntüsü.
