import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import { RENKLER } from "@/lib/theme";
import { formatFiyat, kisaTarih } from "@/lib/format";
import VeriTazelik from "@/components/VeriTazelik";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Girdi Fiyatları — Mazot, Gübre, Elektrik | Anadolu Borsa",
  description: "Üretim girdileri tek ekranda: motorin, gübre (DAP, üre, %33 AN, kompoze) ve elektrik. Gübre ve kaba yem topluluk verisiyle.",
};

const GUBRE = [
  { norm: "DAP", ad: "DAP" },
  { norm: "URE", ad: "Üre" },
  { norm: "AN33", ad: "%33 AN" },
  { norm: "KOMPOZE", ad: "Kompoze (20.20.0)" },
];

const C = { yesil: RENKLER.green, gubre: "#8FB8C8", mazot: "#E8804C" };

export default async function GirdilerPage() {
  const sonGirdi = (tur: string) =>
    supabaseServer.from("girdi_fiyat").select("fiyat, birim, kaynak, gecerlilik_tarihi")
      .eq("girdi_turu", tur).order("gecerlilik_tarihi", { ascending: false }).limit(1);
  const [{ data: mazotRows }, { data: gubrePiyasa }, { data: elektrikRows }, { data: ureRows }] = await Promise.all([
    sonGirdi("mazot"),
    supabaseServer.from("piyasa_fiyatlari").select("urun_norm, agirlikli_ortalama, bildirim_sayisi, il")
      .in("urun_norm", ["DAP", "URE", "AN33", "KOMPOZE"]),
    sonGirdi("elektrik"),
    sonGirdi("ure"),
  ]);
  const elektrik = elektrikRows?.[0];
  // Elle girilmiş liste fiyatları (girdi_guncelle.py): topluluk verisi yokken referans
  const listeFiyat: Record<string, { fiyat: number; tarih: string; kaynak: string | null } | undefined> = {
    URE: ureRows?.[0] ? { fiyat: Number(ureRows[0].fiyat), tarih: ureRows[0].gecerlilik_tarihi, kaynak: ureRows[0].kaynak } : undefined,
  };

  const mazot = mazotRows?.[0];
  // Gübre: norm başına en çok bildirim alan il satırı (temsili topluluk değeri)
  const gubreMap = new Map<string, { ort: number; bildirim: number; il: string }>();
  for (const r of gubrePiyasa ?? []) {
    if (r.agirlikli_ortalama == null) continue;
    const v = gubreMap.get(r.urun_norm);
    if (!v || r.bildirim_sayisi > v.bildirim) {
      gubreMap.set(r.urun_norm, { ort: Number(r.agirlikli_ortalama), bildirim: r.bildirim_sayisi, il: r.il });
    }
  }

  const kart: React.CSSProperties = { background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "18px" };
  const etiket: React.CSSProperties = { fontSize: "12px", color: RENKLER.muted, letterSpacing: "0.06em", marginBottom: "10px", fontWeight: 600 };

  return (
    <main className="ab-container" style={{ maxWidth: "940px", paddingTop: "28px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h1 className="ab-h1">Girdi fiyatları</h1>
        <p style={{ fontSize: "13px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Üretim maliyetinin temel kalemleri. Motorin her gece pompa fiyatından güncellenir; elektrik tarifesi ve gübre liste fiyatı elle girilir, bayi fiyatları topluluk bildirimidir.</p>
      </div>

      {/* Mazot + Elektrik */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {/* Mazot */}
        <div style={kart}>
          <div style={etiket}>MOTORİN</div>
          {mazot ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "34px", color: C.mazot, fontWeight: 800, lineHeight: 1 }}>{formatFiyat(mazot.fiyat)}</span>
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>{mazot.birim ?? "TL/litre"}</span>
              </div>
              <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span>{mazot.kaynak ?? "EPDK"} · {kisaTarih(mazot.gecerlilik_tarihi)}.{String(mazot.gecerlilik_tarihi).slice(0, 4)}</span>
                <VeriTazelik tarih={mazot.gecerlilik_tarihi} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: "12px", color: RENKLER.muted }}>Veri yok</div>
          )}
        </div>

        {/* Elektrik — tarımsal sulama tarifesi (elle, dönemsel) */}
        <div style={kart}>
          <div style={etiket}>ELEKTRİK · TARIMSAL SULAMA</div>
          {elektrik ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span className="ab-num" style={{ fontSize: "34px", color: RENKLER.warn, fontWeight: 800, lineHeight: 1 }}>{formatFiyat(elektrik.fiyat)}</span>
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>{elektrik.birim ?? "TL/kWh"}</span>
              </div>
              <div style={{ fontSize: "12.5px", color: RENKLER.muted, marginTop: "10px" }}>
                {elektrik.kaynak ?? "EPDK"} · {kisaTarih(elektrik.gecerlilik_tarihi)}.{String(elektrik.gecerlilik_tarihi).slice(0, 4)} tarifesi
              </div>
            </>
          ) : (
            <div style={{ fontSize: "13px", color: RENKLER.muted }}>Tarife henüz girilmedi</div>
          )}
        </div>
      </div>

      {/* Gübre */}
      <div style={{ ...kart, padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={etiket}>GÜBRE · TOPLULUK FİYATI</div>
          <Link href="/fiyat-bildir" style={{ fontSize: "12px", color: RENKLER.green, textDecoration: "none" }}>Fiyat bildir →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
          {GUBRE.map((g) => {
            const v = gubreMap.get(g.norm);
            return (
              <div key={g.norm} style={{ background: RENKLER.bg, border: `1px solid ${RENKLER.border}`, borderRadius: "8px", padding: "13px" }}>
                <div style={{ fontSize: "12px", color: RENKLER.text, fontWeight: 600, marginBottom: "6px" }}>{g.ad}</div>
                {v ? (
                  <>
                    <div style={{ fontSize: "22px", color: C.gubre, fontWeight: 800 }}>{formatFiyat(v.ort)}<span style={{ fontSize: "13px", color: RENKLER.muted, fontWeight: 400 }}> ₺/kg</span></div>
                    <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "4px" }}>{v.il} · {v.bildirim} bildirim</div>
                  </>
                ) : listeFiyat[g.norm] ? (
                  <>
                    <div className="ab-num" style={{ fontSize: "22px", color: C.gubre, fontWeight: 800 }}>{formatFiyat(listeFiyat[g.norm]!.fiyat)}<span style={{ fontSize: "13px", color: RENKLER.muted, fontWeight: 400 }}> ₺/kg</span></div>
                    <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "4px" }}>Liste fiyatı · {kisaTarih(listeFiyat[g.norm]!.tarih)} · topluluk verisi bekleniyor</div>
                  </>
                ) : (
                  <div style={{ fontSize: "12.5px", color: RENKLER.muted, lineHeight: 1.5 }}>Topluluk verisi bekleniyor<br />(en az 3 bildirim)</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "12px", lineHeight: 1.5 }}>
          Gübre fiyatı bayide değişir. Topluluk ortalaması TL/kg üzerindendir (çuval/ton girişleri normalize edilir). Resmi liste fiyatı (Gübretaş) yakında.
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
        Motorin: Opet pompa fiyatı (Ankara, Eskişehir, Çorum, Konya ilçe medyanı), her gece · Gübre ve kaba yem: kullanıcı bildirimi (en az 3)
      </div>
    </main>
  );
}
