"use client";
import { useState } from "react";
import { RENKLER, HAYVAN_RENK, emoji } from "@/lib/theme";
import { KARKAS_KG, karkasDipnot } from "@/lib/karkas";
import { formatFiyat } from "@/lib/format";

interface HayvanFiyat {
  hayvan_norm: string;
  fiyat: number | null;
}

export default function SuruDegeri({ fiyatlar }: { fiyatlar: HayvanFiyat[] }) {
  // hayvan_norm başına tek fiyat (karkas ağırlığı tanımlı olanlar)
  const turler = Array.from(
    new Map(
      fiyatlar
        .filter((f) => KARKAS_KG[f.hayvan_norm] && f.fiyat)
        .map((f) => [f.hayvan_norm, f.fiyat as number])
    ).entries()
  ).map(([norm, fiyat]) => ({ norm, fiyat, basFiyat: fiyat * KARKAS_KG[norm] }));

  const [adet, setAdet] = useState<Record<string, number>>({});

  const toplam = turler.reduce((acc, t) => acc + (adet[t.norm] ?? 0) * t.basFiyat, 0);
  const toplamBas = turler.reduce((acc, t) => acc + (adet[t.norm] ?? 0), 0);

  if (turler.length === 0) return null;

  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px", marginTop: "20px" }}>
      <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "12px" }}>
        🧮 SÜRÜ DEĞERİ HESAPLAYICI
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {turler.map((t) => {
          const renk = HAYVAN_RENK[t.norm] ?? RENKLER.red;
          return (
            <div key={t.norm} style={{ background: "#080E09", border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "10px" }}>
              <label style={{ fontSize: "11px", color: RENKLER.text, display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                <span>{emoji(t.norm)}</span>{t.norm}
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0 baş"
                value={adet[t.norm] ?? ""}
                onChange={(e) => setAdet((p) => ({ ...p, [t.norm]: Math.max(0, Number(e.target.value) || 0) }))}
                style={{ width: "100%", padding: "6px 8px", fontSize: "13px", background: RENKLER.bg, color: RENKLER.text, border: `1px solid ${RENKLER.border}`, borderRadius: "3px", fontFamily: "var(--font-mono)" }}
              />
              <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "5px" }}>
                ~{formatFiyat(Math.round(t.basFiyat), 0)} TL/baş
              </div>
              {(adet[t.norm] ?? 0) > 0 && (
                <div style={{ fontSize: "11px", color: renk, fontWeight: 600, marginTop: "3px" }}>
                  = {formatFiyat(Math.round((adet[t.norm] ?? 0) * t.basFiyat), 0)} TL
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${RENKLER.border}` }}>
        <span style={{ fontSize: "11px", color: RENKLER.muted }}>{toplamBas} baş · tahmini sürü değeri</span>
        <span style={{ fontSize: "28px", color: RENKLER.green, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
          {formatFiyat(Math.round(toplam), 0)} <span style={{ fontSize: "13px", color: RENKLER.muted }}>TL</span>
        </span>
      </div>
      {/* 2.3: dipnot koddan üretilir — sabit metin hesapla çelişemez */}
      <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "8px" }}>
        * {karkasDipnot(["KUZU", "TOSUN"])}
      </div>
    </div>
  );
}
