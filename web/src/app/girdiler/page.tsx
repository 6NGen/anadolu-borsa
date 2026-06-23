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
  const [{ data: mazotRows }, { data: gubrePiyasa }] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("fiyat, birim, kaynak, gecerlilik_tarihi")
      .eq("girdi_turu", "mazot").order("gecerlilik_tarihi", { ascending: false }).limit(1),
    supabaseServer.from("piyasa_fiyatlari").select("urun_norm, agirlikli_ortalama, bildirim_sayisi, il")
      .in("urun_norm", ["DAP", "URE", "AN33", "KOMPOZE"]),
  ]);

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
  const etiket: React.CSSProperties = { fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.12em", marginBottom: "10px", fontWeight: 600 };

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-mono)" }}>
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ fontSize: "17px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)", letterSpacing: "0.04em" }}>GİRDİ FİYATLARI</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "5px", lineHeight: 1.5 }}>Üretim maliyetinin temel kalemleri. Mazot resmi; gübre topluluk bildirimiyle (resmi liste fiyatı yakında).</p>
      </div>

      {/* Mazot + Elektrik */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {/* Mazot */}
        <div style={kart}>
          <div style={etiket}>⛽ MOTORİN</div>
          {mazot ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "34px", color: C.mazot, fontWeight: 800, lineHeight: 1 }}>{formatFiyat(mazot.fiyat)}</span>
                <span style={{ fontSize: "12px", color: RENKLER.muted }}>{mazot.birim ?? "TL/litre"}</span>
              </div>
              <div style={{ fontSize: "10px", color: RENKLER.muted, marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span>{mazot.kaynak ?? "EPDK"} · {kisaTarih(mazot.gecerlilik_tarihi)}.{String(mazot.gecerlilik_tarihi).slice(0, 4)}</span>
                <VeriTazelik tarih={mazot.gecerlilik_tarihi} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: "12px", color: RENKLER.muted }}>Veri yok</div>
          )}
        </div>

        {/* Elektrik — yakında */}
        <div style={{ ...kart, opacity: 0.6 }}>
          <div style={etiket}>⚡ ELEKTRİK</div>
          <div style={{ fontSize: "20px", color: RENKLER.muted, fontWeight: 700 }}>Yakında</div>
          <div style={{ fontSize: "10px", color: RENKLER.muted, marginTop: "8px" }}>Tarımsal sulama tarifesi eklenecek</div>
        </div>
      </div>

      {/* Gübre */}
      <div style={{ ...kart, padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={etiket}>🧪 GÜBRE · TOPLULUK FİYATI</div>
          <Link href="/fiyat-bildir" style={{ fontSize: "10px", color: RENKLER.green, textDecoration: "none" }}>Fiyat bildir →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
          {GUBRE.map((g) => {
            const v = gubreMap.get(g.norm);
            return (
              <div key={g.norm} style={{ background: RENKLER.bg, border: `1px solid ${RENKLER.border}`, borderRadius: "8px", padding: "13px" }}>
                <div style={{ fontSize: "12px", color: RENKLER.text, fontWeight: 600, marginBottom: "6px" }}>{g.ad}</div>
                {v ? (
                  <>
                    <div style={{ fontSize: "22px", color: C.gubre, fontWeight: 800 }}>{formatFiyat(v.ort)}<span style={{ fontSize: "11px", color: RENKLER.muted, fontWeight: 400 }}> ₺/kg</span></div>
                    <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "4px" }}>{v.il} · {v.bildirim} bildirim</div>
                  </>
                ) : (
                  <div style={{ fontSize: "10px", color: RENKLER.muted, lineHeight: 1.5 }}>Topluluk verisi bekleniyor<br />(min 3 bildirim)</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "12px", lineHeight: 1.5 }}>
          Gübre fiyatı bayide değişir. Topluluk ortalaması TL/kg üzerindendir (çuval/ton girişleri normalize edilir). Resmi liste fiyatı (Gübretaş) yakında.
        </div>
      </div>

      <div style={{ fontSize: "9px", color: "#2A4030", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
        Mazot fiyatı EPDK/pompa kaynaklıdır, elle güncellenir · Gübre/kaba yem fiyatları kullanıcı bildirimidir (min 3)
      </div>
    </main>
  );
}
