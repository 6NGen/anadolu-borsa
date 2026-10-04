import { supabaseServer } from "@/lib/supabase";
import { Minus, TrendingDown, TrendingUp, Hourglass } from "lucide-react";
import { RENKLER, YEM_RENK } from "@/lib/theme";
import { YEM_AD } from "@/lib/urun-tanim";
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

const ROZET = {
  yuksek: { etiket: "Ortalamanın üstünde", renk: RENKLER.pos, Icon: TrendingUp },
  dusuk:  { etiket: "Ortalamanın altında", renk: RENKLER.neg, Icon: TrendingDown },
  notr:   { etiket: "Ortalama civarı", renk: RENKLER.muted, Icon: Minus },
  veri:   { etiket: "Veri birikiyor", renk: RENKLER.faint, Icon: Hourglass },
} as const;

export default async function SinyalMotoru() {
  const { data } = await supabaseServer
    .from("fiyat_sinyal")
    .select("urun_norm, ort_30gun, bugun, veri_gun_sayisi")
    .order("urun_norm");

  const satirlar = (data ?? []) as SinyalRow[];
  if (satirlar.length === 0) return null;

  return (
    <section style={{ marginBottom: "32px" }}>
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Piyasa yönü</h2>
        {/* 2.5: tek eşik dili — sinyal için en az MIN_VERI_GUN farklı gün gerekir */}
        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
          Son fiyat, son 30 günün ortalamasına göre · en az {MIN_VERI_GUN} işlem günü gerekir · tavsiye değildir
        </p>
      </div>
      <div className="ab-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", overflow: "hidden" }}>
        {satirlar.map((r) => {
          const { tip, sapma } = sinyalHesap(r);
          const rz = ROZET[tip];
          const dusukGuven = tip !== "veri" && r.veri_gun_sayisi < GUVEN_ESIK;
          const renk = YEM_RENK[r.urun_norm] ?? RENKLER.green;
          return (
            <div key={r.urun_norm} style={{ padding: "14px 16px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginRight: "-1px", marginBottom: "-1px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: renk }} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{YEM_AD[r.urun_norm] ?? r.urun_norm}</span>
              </div>
              {tip !== "veri" ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                    <span className="ab-num" style={{ fontSize: "20px", fontWeight: 700 }}>{formatFiyat(r.bugun)}</span>
                    <span className="ab-num" style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12.5px", fontWeight: 600, color: rz.renk }}>
                      <rz.Icon size={14} />
                      {sapma != null ? `${sapma > 0 ? "+" : "−"}%${formatFiyat(Math.abs(sapma), 1)}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px" }}>
                    30 g. ort. {formatFiyat(r.ort_30gun)} · {r.veri_gun_sayisi} gün
                    {dusukGuven && <span style={{ color: "var(--warn)" }}> · düşük güven</span>}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--faint)" }}>
                  <rz.Icon size={14} /> {r.veri_gun_sayisi}/{MIN_VERI_GUN} gün birikti
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
