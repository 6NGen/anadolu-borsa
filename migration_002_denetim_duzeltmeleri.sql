-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 002 — Denetim Düzeltmeleri (güvenlik + veri doğruluğu)
-- ════════════════════════════════════════════════════════════════════
-- NOT: migration_001_schema_fixes.sql repo'da ve git geçmişinde YOK.
-- Bu dosya kendi kendine yeterlidir ve 001'de olduğu söylenen maddeleri
-- (trigger SECURITY DEFINER, parite view, alarm kanal kolonu, kurban view,
-- kullanıcı update/delete policy'leri) de kapsar.
--
-- Uygulama: Supabase Dashboard > SQL Editor > bu dosyayı yapıştır > Run.
-- İdempotenttir: iki kez çalıştırmak güvenlidir.
-- Doğrulama sorguları dosyanın SONUNDA yorum olarak verilmiştir.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- BÖLÜM 1 (KRİTİK GÜVENLİK): RLS'siz tablolar
-- Supabase, public şemadaki tablolara anon/authenticated rollerine
-- varsayılan GRANT verir. RLS kapalıysa anon key ile INSERT/UPDATE/DELETE
-- yapılabilir. Aşağıdaki 4 tablo tamamen korumasızdı.
-- ─────────────────────────────────────────────

ALTER TABLE urun_meta          ENABLE ROW LEVEL SECURITY;
ALTER TABLE girdi_fiyat        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hava_durumu        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedef_varlik_fiyat ENABLE ROW LEVEL SECURITY;  -- üretimde zaten açık olabilir; idempotent

-- Web'in okuması gerekenler: salt-okur public SELECT
DROP POLICY IF EXISTS "public_read_urun_meta" ON urun_meta;
CREATE POLICY "public_read_urun_meta" ON urun_meta FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_girdi" ON girdi_fiyat;
CREATE POLICY "public_read_girdi" ON girdi_fiyat FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_hava" ON hava_durumu;
CREATE POLICY "public_read_hava" ON hava_durumu FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_varlik" ON hedef_varlik_fiyat;
CREATE POLICY "public_read_varlik" ON hedef_varlik_fiyat FOR SELECT USING (true);

-- scraper_log: iç hata mesajları içerir → public SELECT YOK (yalnız service_role).
-- RLS açık + policy yok = anon için tamamen kapalı; scraper service key ile bypass eder.

-- ─────────────────────────────────────────────
-- BÖLÜM 2 (GÜVENLİK): kullanici_fiyat eksik policy'ler + CHECK
-- Kullanıcı kendi bildirimini düzeltemiyor/silemiyordu.
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "kullanici_kendi_gunceller" ON kullanici_fiyat;
CREATE POLICY "kullanici_kendi_gunceller" ON kullanici_fiyat
    FOR UPDATE USING (auth.uid() = kullanici_id) WITH CHECK (auth.uid() = kullanici_id);

DROP POLICY IF EXISTS "kullanici_kendi_siler" ON kullanici_fiyat;
CREATE POLICY "kullanici_kendi_siler" ON kullanici_fiyat
    FOR DELETE USING (auth.uid() = kullanici_id);

-- Negatif/absürt fiyat DB seviyesinde de engellensin (client doğrulaması yetmez)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'kullanici_fiyat_pozitif' AND conrelid = 'kullanici_fiyat'::regclass
    ) THEN
        ALTER TABLE kullanici_fiyat
            ADD CONSTRAINT kullanici_fiyat_pozitif CHECK (fiyat > 0 AND fiyat <= 10000);
    END IF;
END $$;

-- ─────────────────────────────────────────────
-- BÖLÜM 3 (KRİTİK): rozet_guncelle trigger'ı RLS altında sessizce çalışmıyordu
-- Sorunlar:
--   1. SECURITY DEFINER yok → fonksiyon ekleyen kullanıcının yetkisiyle koşar;
--      kullanici_fiyat'ta UPDATE policy'si olmadığından "SET agirlik" 0 satır
--      etkiliyordu (hata da vermez → ağırlık hep 1 kalır).
--   2. profil satırı yoksa UPDATE 0 satır → guven_puani hiç işlemez,
--      RETURNING NULL → agirlik NULL yazılırdı (ağırlıklı ortalamadan düşer).
--   3. search_path sabitlenmemişti (SECURITY DEFINER için zorunlu pratik).
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rozet_guncelle()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE yeni_puan INTEGER;
BEGIN
    IF NEW.kullanici_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- profil satırı yoksa oluştur (auth trigger'ı atlanmış eski kullanıcılar için)
    INSERT INTO profil (id) VALUES (NEW.kullanici_id)
    ON CONFLICT (id) DO NOTHING;

    UPDATE profil SET
        toplam_bildirim = toplam_bildirim + 1,
        guven_puani = CASE
            WHEN toplam_bildirim + 1 >= 50 THEN 5
            WHEN toplam_bildirim + 1 >= 10 THEN 3
            ELSE 1
        END,
        rozet = CASE
            WHEN toplam_bildirim + 1 >= 50 THEN 'guvenilir'
            WHEN toplam_bildirim + 1 >= 10 THEN 'katkilci'
            ELSE 'yeni'
        END
    WHERE id = NEW.kullanici_id
    RETURNING guven_puani INTO yeni_puan;

    UPDATE kullanici_fiyat
    SET agirlik = COALESCE(yeni_puan, 1)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tanımı aynı kalıyor; fonksiyon gövdesi değişti (CREATE OR REPLACE yeterli).

-- ─────────────────────────────────────────────
-- BÖLÜM 4: Yeni kullanıcıda profil otomatik oluşsun (PART4 hazırlığı)
-- Telefon OTP girişi kararına uygun: telefon auth.users.phone'dan kopyalanır.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.yeni_kullanici_profil()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profil (id, telefon)
    VALUES (NEW.id, NEW.phone)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS yeni_kullanici_profil_trigger ON auth.users;
CREATE TRIGGER yeni_kullanici_profil_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.yeni_kullanici_profil();

-- ─────────────────────────────────────────────
-- BÖLÜM 5 (VERİ DOĞRULUĞU): parite_guncel yeniden tasarımı
-- Eski view'daki hatalar:
--   1. LATERAL alt sorgu "ORDER BY cekilme_tarihi DESC LIMIT 2" satır bazlıydı:
--      KUZU hem ESK hem UKON'dan geldiğinde son 2 satır iki KUZU olabilir,
--      SUT tamamen düşerdi; aynı tarihli satırlar arasında sıralama belirsizdi.
--   2. Her TARİHSEL mazot fiyatı GÜNCEL ürün fiyatıyla eşleşiyordu
--      ("1995 mazotu ÷ 2026 sütü" anlamsal hatası).
-- Yeni tasarım: ürün başına tek güncel satır (DISTINCT ON hayvan_norm),
-- yalnız güncel mazot ile eşleşir. Tarihsel parite, ürün tarihsel verisi
-- DB'de birikene kadar hesaplanamaz (web istemcisi tahmini seriyle çiziyor).
-- ─────────────────────────────────────────────

DROP VIEW IF EXISTS parite_guncel;
CREATE VIEW parite_guncel AS
WITH guncel_girdi AS (
    SELECT DISTINCT ON (girdi_turu) girdi_turu, fiyat, gecerlilik_tarihi
    FROM girdi_fiyat
    WHERE fiyat > 0 AND gecerlilik_tarihi <= CURRENT_DATE
    ORDER BY girdi_turu, gecerlilik_tarihi DESC
),
guncel_urun AS (
    SELECT DISTINCT ON (hayvan_norm) hayvan_norm, fiyat, birim, cekilme_tarihi
    FROM hayvan_fiyat_snapshot
    WHERE hayvan_norm IN ('SUT', 'KUZU') AND fiyat > 0
    ORDER BY hayvan_norm, cekilme_tarihi DESC, kaynak  -- kaynak: deterministik kırılım
)
SELECT
    g.gecerlilik_tarihi AS tarih,
    g.girdi_turu,
    g.fiyat             AS girdi_fiyat,
    u.hayvan_norm       AS urun_norm,
    u.fiyat             AS urun_fiyat,
    u.cekilme_tarihi    AS urun_tarihi,
    ROUND(g.fiyat / NULLIF(u.fiyat, 0), 4) AS parite,
    ROUND(u.fiyat / NULLIF(g.fiyat, 0), 4) AS ters_parite
FROM guncel_girdi g
CROSS JOIN guncel_urun u
WHERE g.girdi_turu = 'mazot';

-- ─────────────────────────────────────────────
-- BÖLÜM 6 (VERİ DOĞRULUĞU): fiyat_sinyal
-- Eski hatalar:
--   1. veri_gun_sayisi = COUNT(*) satır sayısıydı; aynı gün 3 borsa = "3 gün"
--      sayılıyordu (30-gün veri şartı yanlış değerlendiriliyordu).
--   2. "bugun" alt sorgusu aynı tarihli farklı borsalar arasında belirsizdi.
-- ─────────────────────────────────────────────

DROP VIEW IF EXISTS fiyat_sinyal;
CREATE VIEW fiyat_sinyal AS
SELECT
    f.urun_norm,
    AVG(f.ortalama) FILTER (
        WHERE f.cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
    ) AS ort_30gun,
    (SELECT f2.ortalama FROM fiyat_snapshot f2
     WHERE f2.urun_norm = f.urun_norm AND f2.ortalama IS NOT NULL
     ORDER BY f2.cekilme_tarihi DESC, f2.borsa  -- borsa: deterministik kırılım
     LIMIT 1) AS bugun,
    COUNT(DISTINCT f.cekilme_tarihi) AS veri_gun_sayisi
FROM fiyat_snapshot f
WHERE f.cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
  AND f.ortalama IS NOT NULL
GROUP BY f.urun_norm;

-- ─────────────────────────────────────────────
-- BÖLÜM 7 (VERİ DOĞRULUĞU): kurban_karsilastirma
-- Eski view ESK + UKON fiyatlarını tek AVG'de karıştırıyordu (farklı
-- metodolojiler). Resmi ESK alım fiyatına sabitlendi; örnek sayısı eklendi.
-- ─────────────────────────────────────────────

DROP VIEW IF EXISTS kurban_karsilastirma;
CREATE VIEW kurban_karsilastirma AS
SELECT
    hayvan_norm,
    EXTRACT(YEAR FROM cekilme_tarihi)::INT AS yil,
    ROUND(AVG(fiyat), 2) AS ortalama_fiyat,
    COUNT(*)             AS veri_sayisi
FROM hayvan_fiyat_snapshot
WHERE EXTRACT(MONTH FROM cekilme_tarihi) BETWEEN 4 AND 7
  AND kaynak = 'ESK'
  AND fiyat > 0
GROUP BY hayvan_norm, EXTRACT(YEAR FROM cekilme_tarihi)
ORDER BY hayvan_norm, yil DESC;

-- ─────────────────────────────────────────────
-- BÖLÜM 8: fiyat_alarm kanal kolonu (PART4 kararı: varsayılan Push/FCM)
-- fcm_token NOT NULL kaldırıldı: e-posta/uygulama-içi kanalda token olmaz.
-- CHECK: push kanalı seçiliyse token zorunlu.
-- ─────────────────────────────────────────────

ALTER TABLE fiyat_alarm ADD COLUMN IF NOT EXISTS kanal TEXT NOT NULL DEFAULT 'push';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fiyat_alarm_kanal_kontrol' AND conrelid = 'fiyat_alarm'::regclass
    ) THEN
        ALTER TABLE fiyat_alarm
            ADD CONSTRAINT fiyat_alarm_kanal_kontrol
            CHECK (kanal IN ('push', 'eposta', 'uygulama_ici'));
    END IF;
END $$;

ALTER TABLE fiyat_alarm ALTER COLUMN fcm_token DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fiyat_alarm_push_token' AND conrelid = 'fiyat_alarm'::regclass
    ) THEN
        ALTER TABLE fiyat_alarm
            ADD CONSTRAINT fiyat_alarm_push_token
            CHECK (kanal <> 'push' OR fcm_token IS NOT NULL);
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- UYGULAMA SONRASI DOĞRULAMA SORGULARI (elle çalıştır, sonuçları karşılaştır)
-- ════════════════════════════════════════════════════════════════════
-- 1) RLS durumu — beş tabloda da rowsecurity = true olmalı:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname='public' AND tablename IN
--      ('urun_meta','girdi_fiyat','hava_durumu','scraper_log','hedef_varlik_fiyat');
--
-- 2) Policy listesi — kullanici_fiyat'ta 4 policy (select/insert/update/delete):
--    SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE schemaname='public' ORDER BY tablename, policyname;
--
-- 3) parite_guncel artık ürün başına TEK satır (SUT + KUZU = 2 satır):
--    SELECT * FROM parite_guncel;
--
-- 4) fiyat_sinyal gün sayısı gerçek gün:
--    SELECT urun_norm, veri_gun_sayisi,
--           (SELECT COUNT(DISTINCT cekilme_tarihi) FROM fiyat_snapshot s
--            WHERE s.urun_norm = f.urun_norm
--              AND s.cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days') AS beklenen
--    FROM fiyat_sinyal f;  -- iki kolon eşit olmalı
--
-- 5) Trigger fonksiyonu SECURITY DEFINER mı:
--    SELECT proname, prosecdef FROM pg_proc
--    WHERE proname IN ('rozet_guncelle','yeni_kullanici_profil');  -- prosecdef=t
--
-- 6) Alarm kolonları:
--    SELECT column_name, is_nullable, column_default
--    FROM information_schema.columns
--    WHERE table_name='fiyat_alarm' AND column_name IN ('kanal','fcm_token');
--
-- 7) Anon yazma kapalı mı (anon key ile, service key DEĞİL):
--    INSERT INTO girdi_fiyat (girdi_turu, fiyat, gecerlilik_tarihi)
--    VALUES ('test', 1, CURRENT_DATE);
--    -- Beklenen: "new row violates row-level security policy" hatası
-- ════════════════════════════════════════════════════════════════════
