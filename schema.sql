-- ════════════════════════════════════════════
-- ANADOLU BORSA — Supabase Şeması
-- ════════════════════════════════════════════

-- TABLO 1: Yem fiyatları (TOBB/KTB)
CREATE TABLE fiyat_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    borsa           TEXT NOT NULL,
    urun            TEXT NOT NULL,
    urun_norm       TEXT NOT NULL,
    birim           TEXT DEFAULT 'KG',
    son_tarih       DATE,
    en_az           NUMERIC(10,4),
    en_cok          NUMERIC(10,4),
    ortalama        NUMERIC(10,4),
    islem_miktari   NUMERIC(12,2),
    cekilme_tarihi  DATE NOT NULL DEFAULT CURRENT_DATE,
    cekilme_zamani  TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_unique_gunluk
    ON fiyat_snapshot (borsa, urun_norm, cekilme_tarihi);
CREATE INDEX idx_urun_tarih
    ON fiyat_snapshot (urun_norm, cekilme_tarihi DESC);

-- TABLO 2: Hayvan + Süt fiyatları (ESK/UKON)
CREATE TABLE hayvan_fiyat_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    kaynak          TEXT NOT NULL,
    hayvan          TEXT NOT NULL,
    hayvan_norm     TEXT NOT NULL,
    kategori        TEXT,
    bolge           TEXT,
    fiyat           NUMERIC(10,2),
    birim           TEXT,
    cekilme_tarihi  DATE NOT NULL DEFAULT CURRENT_DATE,
    cekilme_zamani  TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_unique_hayvan_gunluk
    ON hayvan_fiyat_snapshot (kaynak, hayvan_norm, cekilme_tarihi);
CREATE INDEX idx_hayvan_tarih
    ON hayvan_fiyat_snapshot (hayvan_norm, cekilme_tarihi DESC);

-- TABLO 3: Ürün meta
CREATE TABLE urun_meta (
    urun_norm TEXT PRIMARY KEY,
    urun_ad   TEXT NOT NULL,
    kategori  TEXT,
    renk      TEXT,
    aktif     BOOLEAN DEFAULT true
);
INSERT INTO urun_meta (urun_norm, urun_ad, kategori, renk) VALUES
    ('ARPA',   'Arpa',    'hububat',    '#E8A838'),
    ('BUGDAY', 'Bugday',  'hububat',    '#C4722A'),
    ('MISIR',  'Misir',   'hububat',    '#F0D060'),
    ('SAMAN',  'Saman',   'kaba_yem',   '#A0B878'),
    ('YONCA',  'Yonca',   'kaba_yem',   '#68B890'),
    ('YULAF',  'Yulaf',   'hububat',    '#D4A0C0'),
    ('CAVDAR', 'Cavdar',  'hububat',    '#B8907A'),
    ('SUT',    'Cig_Sut', 'hayvansal',  '#F0F0E0');

-- TABLO 4: Kullanici profili
CREATE TABLE profil (
    id              UUID PRIMARY KEY REFERENCES auth.users(id),
    telefon         TEXT,
    il              TEXT,
    guven_puani     INTEGER DEFAULT 1,
    toplam_bildirim INTEGER DEFAULT 0,
    rozet           TEXT DEFAULT 'yeni',
    olusturma       TIMESTAMPTZ DEFAULT NOW()
);

-- TABLO 5: Kullanici fiyat bildirimleri
CREATE TABLE kullanici_fiyat (
    id               BIGSERIAL PRIMARY KEY,
    urun_norm        TEXT NOT NULL,
    fiyat            NUMERIC(10,2) NOT NULL,
    il               TEXT NOT NULL,
    ilce             TEXT,
    kaynak_turu      TEXT CHECK (kaynak_turu IN
                     ('pazar','tuccar','fabrika','kooperatif')),
    kullanici_id     UUID REFERENCES auth.users(id),
    bayraklandi      BOOLEAN DEFAULT false,
    agirlik          INTEGER DEFAULT 1,
    giris_tarihi     DATE DEFAULT CURRENT_DATE,
    olusturma_zamani TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_gunluk_kullanici_urun
    ON kullanici_fiyat (kullanici_id, urun_norm, giris_tarihi);

-- TABLO 6: Fiyat alarmlari
CREATE TABLE fiyat_alarm (
    id               BIGSERIAL PRIMARY KEY,
    urun_norm        TEXT NOT NULL,
    esik_fiyat       NUMERIC(10,4) NOT NULL,
    yon              TEXT CHECK (yon IN ('asagi','yukari')),
    fcm_token        TEXT NOT NULL,
    kullanici_id     UUID REFERENCES auth.users(id),
    aktif            BOOLEAN DEFAULT true,
    olusturma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- TABLO 7: Girdi maliyetleri (mazot, elektrik)
CREATE TABLE girdi_fiyat (
    id                BIGSERIAL PRIMARY KEY,
    girdi_turu        TEXT NOT NULL,
    fiyat             NUMERIC(10,4) NOT NULL,
    birim             TEXT,
    kaynak            TEXT,
    gecerlilik_tarihi DATE NOT NULL,
    cekilme_zamani    TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_girdi_tarih
    ON girdi_fiyat (girdi_turu, gecerlilik_tarihi);

-- Tarihi mazot verileri (TUIK ile dogrulanacak)
INSERT INTO girdi_fiyat (girdi_turu, fiyat, birim, kaynak, gecerlilik_tarihi) VALUES
    ('mazot', 0.04,  'TL/litre', 'manuel', '1995-01-01'),
    ('mazot', 0.08,  'TL/litre', 'manuel', '1998-01-01'),
    ('mazot', 0.35,  'TL/litre', 'manuel', '2002-01-01'),
    ('mazot', 0.85,  'TL/litre', 'manuel', '2005-01-01'),
    ('mazot', 1.40,  'TL/litre', 'manuel', '2008-01-01'),
    ('mazot', 2.10,  'TL/litre', 'manuel', '2011-01-01'),
    ('mazot', 2.80,  'TL/litre', 'manuel', '2014-01-01'),
    ('mazot', 4.20,  'TL/litre', 'manuel', '2017-01-01'),
    ('mazot', 5.90,  'TL/litre', 'manuel', '2019-01-01'),
    ('mazot', 9.50,  'TL/litre', 'manuel', '2021-01-01'),
    ('mazot', 22.00, 'TL/litre', 'manuel', '2022-06-01'),
    ('mazot', 38.00, 'TL/litre', 'manuel', '2023-01-01'),
    ('mazot', 46.00, 'TL/litre', 'manuel', '2024-01-01'),
    ('mazot', 52.00, 'TL/litre', 'manuel', '2025-01-01'),
    ('mazot', 67.02, 'TL/litre', 'EPDK',   '2026-05-01');

-- TABLO 8: Hava durumu onbellek
CREATE TABLE hava_durumu (
    id             BIGSERIAL PRIMARY KEY,
    il             TEXT NOT NULL,
    enlem          NUMERIC(8,5),
    boylam         NUMERIC(8,5),
    tahmin_tarihi  DATE NOT NULL,
    sicaklik_max   NUMERIC(5,1),
    sicaklik_min   NUMERIC(5,1),
    yagis_toplam   NUMERIC(6,1),
    ruzgar_hiz     NUMERIC(5,1),
    cekilme_zamani TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(il, tahmin_tarihi)
);

-- TABLO 9: Scraper log
CREATE TABLE scraper_log (
    id             BIGSERIAL PRIMARY KEY,
    calisma_tarihi TIMESTAMPTZ DEFAULT NOW(),
    kaynak         TEXT,
    durum          TEXT CHECK (durum IN ('basarili','hata')),
    kayit_sayisi   INTEGER,
    hata_mesaji    TEXT
);

-- TABLO 10: Hedef varlik fiyatlari
CREATE TABLE hedef_varlik_fiyat (
    id                BIGSERIAL PRIMARY KEY,
    varlik_turu       TEXT NOT NULL,
    il                TEXT NOT NULL,
    fiyat             NUMERIC(12,2) NOT NULL,
    birim             TEXT NOT NULL,
    referans_model    TEXT,
    kaynak            TEXT,
    gecerlilik_yili   INTEGER NOT NULL,
    gecerlilik_tarihi DATE NOT NULL,
    cekilme_zamani    TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_varlik_il_yil
    ON hedef_varlik_fiyat (varlik_turu, il, gecerlilik_yili);

INSERT INTO hedef_varlik_fiyat
    (varlik_turu, il, fiyat, birim, referans_model, kaynak, gecerlilik_yili, gecerlilik_tarihi)
VALUES
('tarla_m2', 'Konya', 180,     'TL/m2',  NULL,                        'TUIK',   2015, '2015-01-01'),
('tarla_m2', 'Konya', 280,     'TL/m2',  NULL,                        'TUIK',   2018, '2018-01-01'),
('tarla_m2', 'Konya', 450,     'TL/m2',  NULL,                        'TUIK',   2020, '2020-01-01'),
('tarla_m2', 'Konya', 750,     'TL/m2',  NULL,                        'TUIK',   2022, '2022-01-01'),
('tarla_m2', 'Konya', 980,     'TL/m2',  NULL,                        'TUIK',   2024, '2024-01-01'),
('tarla_m2', 'Konya', 1180,    'TL/m2',  NULL,                        'manuel', 2026, '2026-01-01'),
('arsa_m2',  'Konya', 450,     'TL/m2',  'Konya merkez ort',          'manuel', 2015, '2015-01-01'),
('arsa_m2',  'Konya', 900,     'TL/m2',  'Konya merkez ort',          'manuel', 2018, '2018-01-01'),
('arsa_m2',  'Konya', 1800,    'TL/m2',  'Konya merkez ort',          'manuel', 2020, '2020-01-01'),
('arsa_m2',  'Konya', 2800,    'TL/m2',  'Konya merkez ort',          'manuel', 2022, '2022-01-01'),
('arsa_m2',  'Konya', 3800,    'TL/m2',  'Konya merkez ort',          'manuel', 2024, '2024-01-01'),
('arsa_m2',  'Konya', 4500,    'TL/m2',  'Konya merkez ort',          'manuel', 2026, '2026-01-01'),
('daire_m2', 'Konya', 2800,    'TL/m2',  '100m2 orta segment Konya',  'manuel', 2015, '2015-01-01'),
('daire_m2', 'Konya', 5500,    'TL/m2',  '100m2 orta segment Konya',  'manuel', 2018, '2018-01-01'),
('daire_m2', 'Konya', 9000,    'TL/m2',  '100m2 orta segment Konya',  'manuel', 2020, '2020-01-01'),
('daire_m2', 'Konya', 18000,   'TL/m2',  '100m2 orta segment Konya',  'manuel', 2022, '2022-01-01'),
('daire_m2', 'Konya', 30000,   'TL/m2',  '100m2 orta segment Konya',  'manuel', 2024, '2024-01-01'),
('daire_m2', 'Konya', 38000,   'TL/m2',  '100m2 orta segment Konya',  'manuel', 2026, '2026-01-01'),
('traktor',  'TR',    280000,  'TL/adet','New Holland T4.90 esdeger',  'manuel', 2010, '2010-01-01'),
('traktor',  'TR',    420000,  'TL/adet','New Holland T4.90 esdeger',  'manuel', 2015, '2015-01-01'),
('traktor',  'TR',    680000,  'TL/adet','New Holland T4.90 esdeger',  'manuel', 2018, '2018-01-01'),
('traktor',  'TR',    950000,  'TL/adet','New Holland T4.90 esdeger',  'manuel', 2020, '2020-01-01'),
('traktor',  'TR',    1600000, 'TL/adet','New Holland T4.90 esdeger',  'manuel', 2022, '2022-01-01'),
('traktor',  'TR',    2100000, 'TL/adet','New Holland T4.90 esdeger',  'manuel', 2024, '2024-01-01'),
('traktor',  'TR',    2500000, 'TL/adet','New Holland T4.90 esdeger',  'manuel', 2026, '2026-01-01');

-- RLS
ALTER TABLE fiyat_snapshot        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hayvan_fiyat_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE kullanici_fiyat       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiyat_alarm           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil                ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_yem"        ON fiyat_snapshot        FOR SELECT USING (true);
CREATE POLICY "service_insert_yem"     ON fiyat_snapshot        FOR INSERT WITH CHECK (auth.role()='service_role');
CREATE POLICY "public_read_hayvan"     ON hayvan_fiyat_snapshot FOR SELECT USING (true);
CREATE POLICY "service_insert_hayvan"  ON hayvan_fiyat_snapshot FOR INSERT WITH CHECK (auth.role()='service_role');
CREATE POLICY "public_read_piyasa"     ON kullanici_fiyat       FOR SELECT USING (bayraklandi = false);
CREATE POLICY "kullanici_kendi_girer"  ON kullanici_fiyat       FOR INSERT WITH CHECK (auth.uid() = kullanici_id);
CREATE POLICY "profil_kendi"           ON profil                FOR ALL   USING (auth.uid() = id);
CREATE POLICY "alarm_kendi"            ON fiyat_alarm           FOR ALL   USING (auth.uid() = kullanici_id);

-- Referans varlik tablosu: anon dogrudan okuyabilsin (hedef sayfasi icin).
-- RLS aciksa view disindan erisim 0 satir doner; bu politika onu acar.
ALTER TABLE hedef_varlik_fiyat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_varlik"     ON hedef_varlik_fiyat    FOR SELECT USING (true);

-- VIEW'LAR
CREATE VIEW son_fiyatlar AS
SELECT DISTINCT ON (urun_norm)
    f.urun_norm, m.urun_ad, m.renk, f.borsa,
    f.cekilme_tarihi, f.ortalama, f.en_az, f.en_cok, f.birim
FROM fiyat_snapshot f
LEFT JOIN urun_meta m ON f.urun_norm = m.urun_norm
ORDER BY urun_norm, cekilme_tarihi DESC;

CREATE VIEW son_30_gun AS
SELECT f.urun_norm, m.urun_ad, m.renk, f.borsa,
    f.cekilme_tarihi, f.en_az, f.en_cok, f.ortalama, f.birim
FROM fiyat_snapshot f
LEFT JOIN urun_meta m ON f.urun_norm = m.urun_norm
WHERE f.cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY f.urun_norm, f.cekilme_tarihi ASC;

CREATE VIEW son_hayvan_fiyatlari AS
SELECT DISTINCT ON (kaynak, hayvan_norm)
    kaynak, hayvan, hayvan_norm, kategori, bolge,
    cekilme_tarihi, fiyat, birim
FROM hayvan_fiyat_snapshot
ORDER BY kaynak, hayvan_norm, cekilme_tarihi DESC;

CREATE VIEW son_30_gun_hayvan AS
SELECT kaynak, hayvan, hayvan_norm, kategori,
    cekilme_tarihi, fiyat, birim
FROM hayvan_fiyat_snapshot
WHERE cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY hayvan_norm, cekilme_tarihi ASC;

CREATE VIEW piyasa_fiyatlari AS
SELECT
    urun_norm, il, giris_tarihi,
    ROUND(SUM(fiyat * agirlik)::NUMERIC / NULLIF(SUM(agirlik), 0), 2) AS agirlikli_ortalama,
    ROUND(MIN(fiyat), 2)    AS en_az,
    ROUND(MAX(fiyat), 2)    AS en_cok,
    COUNT(*)                AS bildirim_sayisi,
    ROUND(STDDEV(fiyat), 2) AS standart_sapma
FROM kullanici_fiyat
WHERE bayraklandi = false
  AND giris_tarihi >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY urun_norm, il, giris_tarihi
HAVING COUNT(*) >= 3
ORDER BY urun_norm, il, giris_tarihi DESC;

CREATE VIEW parite_guncel AS
SELECT
    g.gecerlilik_tarihi AS tarih,
    g.girdi_turu,
    g.fiyat             AS girdi_fiyat,
    h.hayvan_norm       AS urun_norm,
    h.fiyat             AS urun_fiyat,
    ROUND(g.fiyat / NULLIF(h.fiyat, 0), 4) AS parite,
    ROUND(h.fiyat / NULLIF(g.fiyat, 0), 4) AS ters_parite
FROM girdi_fiyat g
CROSS JOIN LATERAL (
    SELECT hayvan_norm, fiyat
    FROM hayvan_fiyat_snapshot
    WHERE hayvan_norm IN ('SUT','KUZU')
      AND cekilme_tarihi <= CURRENT_DATE
    ORDER BY cekilme_tarihi DESC
    LIMIT 2
) h
WHERE g.girdi_turu = 'mazot'
ORDER BY tarih ASC;

CREATE VIEW fiyat_sinyal AS
SELECT
    urun_norm,
    AVG(ortalama) FILTER (
        WHERE cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
    ) AS ort_30gun,
    (SELECT ortalama FROM fiyat_snapshot f2
     WHERE f2.urun_norm = f.urun_norm
     ORDER BY cekilme_tarihi DESC LIMIT 1) AS bugun,
    COUNT(*) AS veri_gun_sayisi
FROM fiyat_snapshot f
WHERE cekilme_tarihi >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY urun_norm;

CREATE VIEW kurban_karsilastirma AS
SELECT
    hayvan_norm,
    EXTRACT(YEAR FROM cekilme_tarihi) AS yil,
    AVG(fiyat) AS ortalama_fiyat
FROM hayvan_fiyat_snapshot
WHERE EXTRACT(MONTH FROM cekilme_tarihi) BETWEEN 4 AND 7
GROUP BY hayvan_norm, EXTRACT(YEAR FROM cekilme_tarihi)
ORDER BY hayvan_norm, yil DESC;

CREATE VIEW uretici_hedef_parite AS
SELECT
    f.urun_norm, f.urun_ad,
    f.ortalama AS urun_fiyat_kg,
    h.varlik_turu, h.il,
    h.fiyat    AS varlik_fiyat,
    h.birim    AS varlik_birim,
    h.referans_model,
    h.gecerlilik_yili,
    CASE
        WHEN h.birim = 'TL/m2'
            THEN ROUND((f.ortalama * 1000) / NULLIF(h.fiyat, 0), 2)
        WHEN h.birim = 'TL/adet'
            THEN ROUND((f.ortalama * 1000) / NULLIF(h.fiyat, 0) * 100, 2)
    END AS karsilik,
    CASE
        WHEN h.birim = 'TL/m2'   THEN 'm2'
        WHEN h.birim = 'TL/adet' THEN '%'
    END AS karsilik_birim
FROM (
    SELECT DISTINCT ON (urun_norm)
        urun_norm, urun_ad, ortalama
    FROM son_fiyatlar
    ORDER BY urun_norm, cekilme_tarihi DESC
) f
CROSS JOIN (
    SELECT DISTINCT ON (varlik_turu, il)
        varlik_turu, il, fiyat, birim, referans_model, gecerlilik_yili
    FROM hedef_varlik_fiyat
    ORDER BY varlik_turu, il, gecerlilik_yili DESC
) h
ORDER BY f.urun_norm, h.varlik_turu;

-- TRIGGER: Rozet guncelleme
CREATE OR REPLACE FUNCTION rozet_guncelle()
RETURNS TRIGGER AS $$
DECLARE yeni_puan INTEGER;
BEGIN
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
    SET agirlik = yeni_puan
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rozet_trigger
AFTER INSERT ON kullanici_fiyat
FOR EACH ROW EXECUTE FUNCTION rozet_guncelle();
