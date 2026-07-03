import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import { enGuncelYem, enGuncelHayvan, distinctGun, gunlukSeri } from "@/lib/guncel";
import PariteClient, { Girdi, Urun } from "@/components/PariteClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Mazot / Süt Paritesi — 1 Litre Motorin Kaç Litre Süt? | Anadolu Borsa",
  description: "Çiftçi satın alma gücü endeksi: 1 litre motorin kaç litre çiğ süt, kaç kg arpa ediyor? Günlük, kaynaklı parite.",
};

// Ürün TARİHSEL serileri TÜİK tahminidir (DB'de geçmiş ürün fiyatı yok);
// GÜNCEL fiyatlar her zaman canlı DB'den gelir (son_30_gun / son_30_gun_hayvan).
// Canlı veri yoksa ürün çipi pasifleşir — statik değer asla "güncel" diye gösterilmez.
const TUIK_URUN: Record<string, { ad: string; ikon: string; renk: string; birim: string; norm: string; tip: "yem" | "hayvan"; hist: { y: string; f: number }[] }> = {
  sut: {
    ad: "Çiğ Süt", ikon: "🥛", renk: "#E8F0E0", birim: "TL/litre", norm: "SUT", tip: "hayvan",
    hist: [{ y: "1995", f: 0.08 }, { y: "2002", f: 0.28 }, { y: "2005", f: 0.50 }, { y: "2010", f: 0.80 }, { y: "2015", f: 1.10 }, { y: "2019", f: 1.80 }, { y: "2021", f: 2.60 }, { y: "2022", f: 5.20 }, { y: "2023", f: 11.0 }, { y: "2024", f: 14.5 }, { y: "2025", f: 16.5 }, { y: "2026", f: 18.0 }],
  },
  arpa: {
    ad: "Arpa", ikon: "🌾", renk: "#D4A843", birim: "TL/kg", norm: "ARPA", tip: "yem",
    hist: [{ y: "1995", f: 0.03 }, { y: "2002", f: 0.12 }, { y: "2005", f: 0.25 }, { y: "2010", f: 0.42 }, { y: "2015", f: 0.55 }, { y: "2019", f: 0.90 }, { y: "2021", f: 2.10 }, { y: "2022", f: 5.50 }, { y: "2023", f: 8.50 }, { y: "2024", f: 12.5 }, { y: "2025", f: 13.8 }, { y: "2026", f: 14.60 }],
  },
  kuzu: {
    ad: "Kuzu", ikon: "🐑", renk: "#6890D8", birim: "TL/kg", norm: "KUZU", tip: "hayvan",
    hist: [{ y: "1995", f: 0.80 }, { y: "2002", f: 3.50 }, { y: "2005", f: 6.00 }, { y: "2010", f: 11.0 }, { y: "2015", f: 18.0 }, { y: "2019", f: 28.0 }, { y: "2021", f: 45.0 }, { y: "2022", f: 90.0 }, { y: "2023", f: 180 }, { y: "2024", f: 350 }, { y: "2025", f: 400 }, { y: "2026", f: 480 }],
  },
  bugday: {
    ad: "Buğday", ikon: "🌿", renk: "#B8612A", birim: "TL/kg", norm: "BUGDAY", tip: "yem",
    hist: [{ y: "1995", f: 0.04 }, { y: "2002", f: 0.14 }, { y: "2005", f: 0.28 }, { y: "2010", f: 0.46 }, { y: "2015", f: 0.60 }, { y: "2019", f: 0.95 }, { y: "2021", f: 2.20 }, { y: "2022", f: 6.00 }, { y: "2023", f: 9.00 }, { y: "2024", f: 13.0 }, { y: "2025", f: 14.5 }, { y: "2026", f: 15.20 }],
  },
  misir: {
    ad: "Mısır", ikon: "🌽", renk: "#E8C040", birim: "TL/kg", norm: "MISIR", tip: "yem",
    hist: [{ y: "1995", f: 0.03 }, { y: "2002", f: 0.11 }, { y: "2005", f: 0.24 }, { y: "2010", f: 0.40 }, { y: "2015", f: 0.52 }, { y: "2019", f: 0.88 }, { y: "2021", f: 2.00 }, { y: "2022", f: 5.20 }, { y: "2023", f: 8.20 }, { y: "2024", f: 11.5 }, { y: "2025", f: 12.8 }, { y: "2026", f: 13.0 }],
  },
};

// GİRDİ SÜTUNLARI (matris GÜNCELLEME 2): mazot + elektrik + üre + DAP.
// Tümü girdi_fiyat tablosundan canlı; DB'de verisi olmayan tür PASİF kalır
// (sütun görünmez — sahte veri yok). Manuel giriş: scraper/girdi_guncelle.py
// Kaynaklar: mazot EPDK/pompa · elektrik EPDK tarımsal sulama ·
// üre/DAP Tarım Kredi/Gübretaş liste.
const GIRDI_TANIM: Record<string, { ad: string; ikon: string; renk: string; birim: string }> = {
  mazot: { ad: "Motorin", ikon: "⛽", renk: "#E86040", birim: "TL/litre" },
  elektrik: { ad: "Elektrik", ikon: "⚡", renk: "#E8C840", birim: "TL/kWh" },
  ure: { ad: "Üre", ikon: "⚪", renk: "#8FB8C8", birim: "TL/kg" },
  dap: { ad: "DAP", ikon: "🟤", renk: "#C89060", birim: "TL/kg" },
};

export default async function ParitePage() {
  const [{ data: girdiRows }, { data: yem30 }, { data: hay30 }] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("girdi_turu, fiyat, gecerlilik_tarihi").in("girdi_turu", Object.keys(GIRDI_TANIM)).order("gecerlilik_tarihi"),
    supabaseServer.from("son_30_gun").select("urun_norm, borsa, cekilme_tarihi, ortalama").in("urun_norm", ["ARPA", "BUGDAY", "MISIR"]).order("cekilme_tarihi"),
    supabaseServer.from("son_30_gun_hayvan").select("hayvan_norm, kaynak, cekilme_tarihi, fiyat").in("hayvan_norm", ["SUT", "KUZU"]).order("cekilme_tarihi"),
  ]);

  const girdiler: Record<string, Girdi> = {};
  for (const [tur, t] of Object.entries(GIRDI_TANIM)) {
    // Gerçek tarihsel seri (girdi_fiyat; mazot 1995→bugün, diğerleri girildikçe)
    const hist = (girdiRows ?? [])
      .filter((r) => r.girdi_turu === tur && r.fiyat != null && r.gecerlilik_tarihi)
      .map((r) => ({ y: String(r.gecerlilik_tarihi).slice(0, 4), f: Number(r.fiyat) }));
    const guncel = hist.at(-1)?.f ?? null;
    const tarih = (girdiRows ?? []).filter((r) => r.girdi_turu === tur).at(-1)?.gecerlilik_tarihi ?? null;
    girdiler[tur] = {
      ...t,
      hist,
      guncel: guncel ?? 0,
      aktif: guncel != null, // tek kayıt bile sütunu açar; grafik ≥2 yıl isteyince görünür
      tarih: tarih ? String(tarih) : null,
    };
  }

  const urunler: Record<string, Urun> = {};
  for (const [k, v] of Object.entries(TUIK_URUN)) {
    let guncelF: ReturnType<typeof enGuncelYem> = null;
    let satirlar: { cekilme_tarihi: string; deger: number | null; kirilim: string }[] = [];

    if (v.tip === "yem") {
      const rows = (yem30 ?? []).filter((r) => r.urun_norm === v.norm);
      guncelF = enGuncelYem(rows);
      satirlar = rows.map((r) => ({ cekilme_tarihi: r.cekilme_tarihi, deger: r.ortalama, kirilim: r.borsa }));
    } else {
      const rows = (hay30 ?? []).filter((r) => r.hayvan_norm === v.norm);
      guncelF = enGuncelHayvan(rows);
      satirlar = rows.map((r) => ({ cekilme_tarihi: r.cekilme_tarihi, deger: r.fiyat, kirilim: r.kaynak }));
    }

    const canli = guncelF != null;
    // TÜİK serisinin 2026 ucu canlı fiyatla değiştirilir (yalnızca canlıysa)
    const hist = canli ? v.hist.map((p) => (p.y === "2026" ? { ...p, f: guncelF!.fiyat } : p)) : v.hist;

    urunler[k] = {
      ad: v.ad, ikon: v.ikon, renk: v.renk, birim: v.birim,
      hist,
      guncel: guncelF?.fiyat ?? 0,
      canli,
      kaynak: guncelF?.kaynak ?? null,
      tarih: guncelF?.tarih ?? null,
      gercekGun: distinctGun(satirlar),
      gercekSeri: gunlukSeri(satirlar),
    };
  }

  return <PariteClient girdiler={girdiler} urunler={urunler} />;
}
