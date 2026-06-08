"use client";
import { useState } from "react";
import FiyatGrafik from "./FiyatGrafik";
import { YEM_RENK, RENKLER } from "@/lib/theme";

interface SonFiyat {
  urun_norm: string;
  urun_ad: string | null;
  renk: string | null;
  borsa: string;
  cekilme_tarihi: string;
  ortalama: number | null;
  en_az: number | null;
  en_cok: number | null;
  birim: string;
}

interface GrafikVeri {
  urun_norm: string;
  cekilme_tarihi: string;
  ortalama: number | null;
  en_az: number | null;
  en_cok: number | null;
}

interface Props {
  sonFiyatlar: SonFiyat[];
  grafik: GrafikVeri[];
}

export default function TarimClient({ sonFiyatlar, grafik }: Props) {
  const [secilen, setSecilen] = useState<string>(sonFiyatlar[0]?.urun_norm ?? "ARPA");

  const grafikVeri = grafik
    .filter((g) => g.urun_norm === secilen)
    .map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.ortalama ?? 0, en_az: g.en_az ?? 0, en_cok: g.en_cok ?? 0 }));

  const sf = sonFiyatlar.find((f) => f.urun_norm === secilen);
  const renk = YEM_RENK[secilen] ?? RENKLER.green;

  return (
    <div>
      {/* Ürün butonları */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {sonFiyatlar.map((f) => {
          const r = YEM_RENK[f.urun_norm] ?? RENKLER.green;
          const aktif = f.urun_norm === secilen;
          return (
            <button
              key={f.urun_norm}
              onClick={() => setSecilen(f.urun_norm)}
              style={{ padding: "5px 12px", fontSize: "11px", background: aktif ? r : RENKLER.surface, color: aktif ? "#000" : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            >
              {f.urun_norm}
            </button>
          );
        })}
      </div>

      {/* Anlık fiyat */}
      {sf && (
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginBottom: "16px" }}>
          <span style={{ fontSize: "36px", color: renk, fontWeight: 700, lineHeight: 1 }}>{sf.ortalama?.toFixed(2) ?? "—"}</span>
          <span style={{ fontSize: "13px", color: RENKLER.muted }}>TL/KG</span>
          <span style={{ fontSize: "11px", color: RENKLER.muted }}>{sf.borsa} · {sf.cekilme_tarihi}</span>
        </div>
      )}

      {/* Grafik */}
      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "12px" }}>
        <div style={{ fontSize: "10px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.1em" }}>30 GÜN TARİHÇE</div>
        <FiyatGrafik data={grafikVeri} renk={renk} birim="TL/KG" urun_ad={sf?.urun_ad ?? secilen} />
      </div>
    </div>
  );
}
