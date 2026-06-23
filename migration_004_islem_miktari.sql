-- ============================================================
-- migration_004_islem_miktari.sql
-- İşlem miktarı (hacim) fiyat_snapshot'ta zaten çekiliyordu ama view'larda
-- gösterilmiyordu. Fiyat kartlarında "X ton işlem" + düşük hacim bağlamı için
-- son_fiyatlar ve son_30_gun view'larına islem_miktari kolonu eklenir.
-- (islem_miktari KG cinsindendir; UI ton'a çevirir: /1000)
--
-- CREATE OR REPLACE: yeni kolon sona eklenir, mevcut kolonlar değişmez → güvenli.
-- Idempotent: tekrar çalıştırılabilir. SQL Editor'e yapıştır → Run.
-- ============================================================

BEGIN;

CREATE OR REPLACE VIEW son_fiyatlar AS
SELECT DISTINCT ON (urun_norm)
    f.urun_norm, m.urun_ad, m.renk, f.borsa,
    f.cekilme_tarihi, f.ortalama, f.en_az, f.en_cok, f.birim, f.islem_miktari
FROM fiyat_snapshot f
LEFT JOIN urun_meta m ON f.urun_norm = m.urun_norm
ORDER BY urun_norm, cekilme_tarihi DESC;

CREATE OR REPLACE VIEW son_30_gun AS
SELECT f.urun_norm, m.urun_ad, m.renk, f.borsa,
    f.cekilme_tarihi, f.en_az, f.en_cok, f.ortalama, f.birim, f.islem_miktari
FROM fiyat_snapshot f
LEFT JOIN urun_meta m ON f.urun_norm = m.urun_norm
WHERE f.cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY f.urun_norm, f.cekilme_tarihi ASC;

COMMIT;
