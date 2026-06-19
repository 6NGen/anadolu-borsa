-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 003 — Süt kaynağı temizliği (ESK_SUT → USK geçişi)
-- ════════════════════════════════════════════════════════════════════
-- SORUN:
--   Süt fiyatı eskiden ESK'nin "Çiğ Süt Alım Fiyatları" sayfasından
--   kaynak='ESK_SUT' ile çekiliyordu (son değer 19,50 TL). ESK bu sayfaları
--   yayından kaldırınca (hepsi 404) scraper, Ulusal Süt Konseyi'nin tavsiye
--   fiyatına geçti: kaynak='USK' (güncel ~24,30 TL). Kod commit 93c57ea ile
--   düzeltildi, AMA eski ESK_SUT satırları veritabanında kaldı.
--
-- BELİRTİ:
--   son_hayvan_fiyatlari view'ı DISTINCT ON (kaynak, hayvan_norm) olduğu için
--   ESK_SUT/SUT (19,50) ve USK/SUT (24,30) AYRI satırlar sayılıyor →
--   Hayvan sayfasında İKİ tane "SUT" görünüyor, biri eski 19,50 değerinde.
--   Ayrıca parite_guncel aynı tarihte iki kaynak olunca 'ESK_SUT' < 'USK'
--   sıralamasıyla yanlışlıkla eski 19,50'yi seçiyordu.
--
-- ÇÖZÜM:
--   Ölü kaynak olan ESK_SUT satırlarını sil. Geriye tek güncel süt kaynağı
--   (USK) kalır; hem hayvan sayfasındaki çift kayıt hem paritedeki yanlış
--   seçim düzelir. Scraper kodu (usk_sut_scrape) zaten doğru; değişmiyor.
--
-- Uygulama: Supabase Dashboard > SQL Editor > bu dosyayı yapıştır > Run.
-- İdempotenttir: iki kez çalıştırmak güvenlidir (ikinci sefer 0 satır siler).
-- ════════════════════════════════════════════════════════════════════

-- Güvenlik notu: USK süt kaydının var olduğunu doğrulamadan silmek, süt
-- verisini tamamen yok edip pariteyi boşaltabilir. Bu yüzden ESK_SUT'u
-- yalnızca en az bir geçerli USK süt kaydı varsa siliyoruz.
DELETE FROM hayvan_fiyat_snapshot
WHERE kaynak = 'ESK_SUT'
  AND EXISTS (
    SELECT 1 FROM hayvan_fiyat_snapshot u
    WHERE u.hayvan_norm = 'SUT' AND u.kaynak = 'USK' AND u.fiyat > 0
  );

-- ════════════════════════════════════════════════════════════════════
-- DOĞRULAMA (silme sonrası çalıştırın; yorum işaretlerini kaldırarak):
-- ════════════════════════════════════════════════════════════════════
-- 1) Artık hiç ESK_SUT satırı kalmamalı:
--    SELECT count(*) FROM hayvan_fiyat_snapshot WHERE kaynak = 'ESK_SUT';
--    -- beklenen: 0
--
-- 2) Hayvan sayfasında süt tek satır olmalı (yalnız USK):
--    SELECT kaynak, hayvan_norm, fiyat, cekilme_tarihi
--    FROM son_hayvan_fiyatlari WHERE hayvan_norm = 'SUT';
--    -- beklenen: 1 satır, kaynak = USK, fiyat ~24,30
--
-- 3) Parite artık USK fiyatını kullanmalı:
--    SELECT urun_norm, urun_fiyat, urun_tarihi FROM parite_guncel
--    WHERE urun_norm = 'SUT';
--    -- beklenen: urun_fiyat ~24,30
-- ════════════════════════════════════════════════════════════════════
