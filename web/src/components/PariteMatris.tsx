"use client";
import { useState } from "react";
import { oranBicim } from "@/lib/format";
import { gunFarki, BAYAT_ESIK_GUN } from "@/lib/tazelik";
import type { Girdi, Urun } from "./PariteClient";

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#4A7050", txt: "#DDF0DE" };
const URUN_RENK = "#E8C040"; // çıktı/ürün satır vurgusu (başak/sarı)
const GIRDI_RENK = "#6090E8"; // girdi sütun vurgusu (mavi)

const birimAd = (b: string) => b.replace("TL/", "");

type Yon = "ug" | "gu"; // ürün→girdi (varsayılan) | girdi→ürün

export default function PariteMatris({
  girdiler, urunler, seciliGirdi, seciliUrun, onSec,
}: {
  girdiler: Record<string, Girdi>;
  urunler: Record<string, Urun>;
  seciliGirdi: string;
  seciliUrun: string;
  onSec: (girdi: string, urun: string) => void;
}) {
  const [yon, setYon] = useState<Yon>("ug");
  const [hover, setHover] = useState<{ g?: string; u?: string }>({});

  const girdiKeys = Object.keys(girdiler).filter((k) => girdiler[k].aktif);
  const urunKeys = Object.keys(urunler).filter((k) => urunler[k].canli);
  if (girdiKeys.length === 0 || urunKeys.length === 0) return null;

  // Hücre oranı + sonuç birimi (yöne göre)
  function hucre(gk: string, uk: string): { deger: string; birim: string } {
    const g = girdiler[gk], u = urunler[uk];
    if (!(g.guncel > 0) || !(u.guncel > 0)) return { deger: "—", birim: "" };
    if (yon === "ug") return { deger: oranBicim(u.guncel / g.guncel), birim: birimAd(g.birim) };
    return { deger: oranBicim(g.guncel / u.guncel), birim: birimAd(u.birim) };
  }

  const rehber = yon === "ug"
    ? "1 birim ÜRÜN kaç birim GİRDİ eder — çiftçinin alım gücü"
    : "1 birim GİRDİ kaç birim ÜRÜN eder — girdinin ürün cinsinden bedeli";

  const th: React.CSSProperties = { padding: "10px 12px", fontSize: 11, fontWeight: 700, borderBottom: `1px solid ${C.brd}`, whiteSpace: "nowrap" };

  return (
    <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
      {/* Başlık + yön */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2 }}>PARİTE MATRİSİ — CANLI</div>
          <div style={{ fontSize: 11, color: C.txt, marginTop: 4 }}>{rehber}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setYon("ug")} style={ybtn(yon === "ug")}>Ürün → Girdi</button>
          <button onClick={() => setYon("gu")} style={ybtn(yon === "gu")}>Girdi → Ürün</button>
        </div>
      </div>

      <div style={{ overflowX: "auto", margin: "0 -4px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: girdiKeys.length > 1 ? 460 : 320, fontFamily: "monospace" }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", color: C.mut, position: "sticky", left: 0, background: C.surf, zIndex: 2, fontSize: 9 }}>
                {yon === "ug" ? "ÜRÜN ↓ / GİRDİ →" : "ÜRÜN ↓ / GİRDİ →"}
              </th>
              {girdiKeys.map((gk) => {
                const g = girdiler[gk];
                const vurgu = hover.g === gk;
                return (
                  <th key={gk} style={{ ...th, textAlign: "center", color: GIRDI_RENK, background: vurgu ? `${GIRDI_RENK}14` : undefined }}>
                    <div>{g.ikon} {g.ad}</div>
                    <div style={{ fontSize: 8, color: C.mut, fontWeight: 400 }}>{birimAd(g.birim)} başına</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {urunKeys.map((uk) => {
              const u = urunler[uk];
              const bayat = (gunFarki(u.tarih) ?? 0) >= BAYAT_ESIK_GUN;
              const satirVurgu = hover.u === uk;
              return (
                <tr key={uk}>
                  <td style={{
                    padding: "10px 12px", fontSize: 11, fontWeight: 700, color: URUN_RENK, whiteSpace: "nowrap",
                    borderBottom: "1px solid #0E1C10", position: "sticky", left: 0, zIndex: 1,
                    background: satirVurgu ? "#0E1A12" : C.surf,
                  }}>
                    {u.ikon} {u.ad}
                    {bayat && <span title="Veri 3+ gün eski" style={{ color: "#E8C040", marginLeft: 5 }}>⚠</span>}
                  </td>
                  {girdiKeys.map((gk) => {
                    const h = hucre(gk, uk);
                    const secili = gk === seciliGirdi && uk === seciliUrun;
                    return (
                      <td
                        key={gk}
                        onClick={() => onSec(gk, uk)}
                        onMouseEnter={() => setHover({ g: gk, u: uk })}
                        onMouseLeave={() => setHover({})}
                        style={{
                          padding: "10px 12px", textAlign: "center", cursor: "pointer", borderBottom: "1px solid #0E1C10",
                          background: secili ? `${URUN_RENK}1A` : (hover.g === gk || hover.u === uk) ? "#0C160E" : "transparent",
                          outline: secili ? `1px solid ${URUN_RENK}80` : "none",
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>{h.deger}</div>
                        <div style={{ fontSize: 8, color: C.mut, marginTop: 2 }}>{h.birim}</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 8, color: C.mut, marginTop: 10, lineHeight: 1.6 }}>
        Hücreye dokun → aşağıdaki grafik o pariteye geçer · ⚠ veri 3+ gün eski · Matris yalnızca oranı gösterir; alım-satım tavsiyesi vermez.
      </div>
    </div>
  );
}

function ybtn(aktif: boolean): React.CSSProperties {
  return {
    background: aktif ? GIRDI_RENK : "transparent",
    border: `1px solid ${aktif ? GIRDI_RENK : C.brd}`,
    color: aktif ? "#060E08" : C.mut,
    padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 10.5, fontWeight: aktif ? 700 : 400,
    fontFamily: "monospace", transition: "all .15s",
  };
}
