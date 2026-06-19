-- ============================================================
-- migration_003_outlier.sql
-- Kullanıcı fiyat bildirimi OUTLIER işaretleme — DB TRIGGER ile.
-- (Edge Function + webhook GEREKMEZ; CLI kurmana gerek yok.)
--
-- Kural: aynı ürün + il, son 7 gün, henüz bayraklanmamış diğer bildirimlerin
--        ortalaması ± 2σ (standart sapma) dışındaki YENİ kayıt → bayraklandi=true.
--        piyasa_fiyatlari view'ı bayraklı kayıtları zaten gizler.
-- Soğuk başlangıç: en az 3 geçmiş bildirim yoksa kontrol atlanır (kimseyi yanlış eleme).
-- Resmi borsa anomalisi BURADA DEĞİL — o scraper tarafında (VERI_GUVENLIK) çözülür.
--
-- Idempotent: tekrar çalıştırılabilir. SQL Editor'e yapıştır → Run.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION outlier_isaretle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- RLS'i aşıp tüm bildirimlerin ortalamasını görebilsin
SET search_path = public
AS $$
DECLARE
  v_ort   NUMERIC;
  v_sigma NUMERIC;
  v_adet  INT;
BEGIN
  -- BEFORE INSERT: yeni satır henüz tabloda yok → ortalama onsuz hesaplanır
  SELECT avg(fiyat), stddev_pop(fiyat), count(*)
    INTO v_ort, v_sigma, v_adet
  FROM kullanici_fiyat
  WHERE urun_norm = NEW.urun_norm
    AND il = NEW.il
    AND bayraklandi = false
    AND giris_tarihi >= CURRENT_DATE - INTERVAL '7 days';

  IF v_adet >= 3 AND v_sigma IS NOT NULL AND v_sigma > 0
     AND abs(NEW.fiyat - v_ort) > 2 * v_sigma THEN
    NEW.bayraklandi := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_outlier_isaretle ON kullanici_fiyat;
CREATE TRIGGER trg_outlier_isaretle
  BEFORE INSERT ON kullanici_fiyat
  FOR EACH ROW EXECUTE FUNCTION outlier_isaretle();

COMMIT;

-- DOĞRULAMA (opsiyonel, çalıştırınca trigger'ın kurulduğunu görürsün):
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'kullanici_fiyat'::regclass;
