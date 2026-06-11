import { supabaseServer } from "@/lib/supabase";
import { RENKLER, YEM_RENK, emoji } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";

interface SinyalRow {
  urun_norm: string;
  ort_30gun: number | null;
  bugun: number | null;
  veri_gun_sayisi: number;
}

// 30 günlük pencerede sinyal için gereken asgari veri günü.
// Bu eşik altında "veri birikiyor" gösterilir (30 gün veri şartı).
const MIN_VERI_GUN = 5;
const GUVEN_ESIK = 15; // bunun altında "düşük güven"
const NOTR_BANT = 2;   // ±%2 içinde nötr

function sinyalHesap(r: SinyalRow) {
  if (r.bugun == null || r.ort_30gun == null || r.veri_gun_sayisi < MIN_VERI_GUN) {
    return { tip: "veri" as const, sapma: null as number | null };
  }
  const sapma = ((r.bugun - r.ort_30gun) / r.ort_30gun) * 100;
  if (sapma >= NOTR_BANT) return { tip: "yuksek" as const, sapma };
  if (sapma <= -NOTR_BANT) return { tip: "dusuk" as const, sapma };
  return { tip: "notr" as const, sapma };
}

const ROZET: Record<string, { etiket: string; renk: string; ikon: string }> = {
  yuksek: { etiket: "ORTALAMA ÜSTÜ", renk: RENKLER.pos, ikon: "▲" },
  dusuk:  { etiket: "ORTALAMA ALTI", renk: RENKLER.neg, ikon: "▼" },
  notr:   { etiket: "NÖTR", renk: RENKLER.muted, ikon: "─" },
  veri:   { etiket: "VERİ BİRİKİYOR", renk: RENKLER.muted, ikon: "⋯" },
};

export default async function SinyalMotoru() {
  const { data } = await supabaseServer
    .from("fiyat_sinyal")
    .select("urun_norm, ort_30gun, bugun, veri_gun_sayisi")
    .order("urun_norm");

  const satirlar = (data ?? []) as SinyalRow[];
  if (satirlar.length === 0) return null;

  return (
    <section style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.12em" }}>📡 SİNYAL MOTORU</span>
        {/* 2.5: tek eşik dili — sinyal için en az MIN_VERI_GUN farklı gün gerekir */}
        <span style={{ fontSize: "9px", color: RENKLER.muted }}>· bugün vs 30 güne kadar ortalama · en az {MIN_VERI_GUN} gün veri gerekir</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
        {satirlar.map((r) => {
          const { tip, sapma } = sinyalHesap(r);
          const rz = ROZET[tip];
          const dusukGuven = tip !== "veri" && r.veri_gun_sayisi < GUVEN_ESIK;
          const renk = YEM_RENK[r.urun_norm] ?? RENKLER.green;
          return (
            <div key={r.urun_norm} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderLeft: `3px solid ${rz.renk}`, borderRadius: "4px", padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: RENKLER.text, fontWeight: 600 }}>
                  <span style={{ marginRight: "5px" }}>{emoji(r.urun_norm)}</span>{r.urun_norm}
                </span>
                <span style={{ fontSize: "10px", color: rz.renk, fontWeight: 700 }}>{rz.ikon} {rz.etiket}</span>
              </div>
              {tip !== "veri" ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "20px", color: renk, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{formatFiyat(r.bugun)}</span>
                    <span style={{ fontSize: "11px", color: rz.renk, fontWeight: 600 }}>
                      {sapma != null ? `${sapma > 0 ? "+" : "−"}%${formatFiyat(Math.abs(sapma), 1)}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "4px" }}>
                    30g ort: {formatFiyat(r.ort_30gun)} · {r.veri_gun_sayisi} gün veri
                    {dusukGuven && <span style={{ color: "#E8A838" }}> · düşük güven</span>}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "10px", color: RENKLER.muted }}>
                  {r.veri_gun_sayisi}/{MIN_VERI_GUN} gün birikti — sinyal için en az {MIN_VERI_GUN} gün gerekir
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
