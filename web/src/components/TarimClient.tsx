"use client";
import { useState } from "react";
import FiyatGrafik from "./FiyatGrafik";
import VeriTazelik from "./VeriTazelik";
import { YEM_RENK, RENKLER } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";
import { enGuncelYem, distinctGun } from "@/lib/guncel";

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
  borsa: string;
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
  const [borsaSecim, setBorsaSecim] = useState<string | null>(null);

  // Seçili ürünün tüm satırları (30 gün, tüm borsalar)
  const urunSatirlari = grafik.filter((g) => g.urun_norm === secilen);
  const borsalar = [...new Set(urunSatirlari.map((g) => g.borsa))].sort();

  // Varsayılan borsa: deterministik en güncel (parite sayfasıyla aynı kural → aynı sayı)
  const varsayilanBorsa = enGuncelYem(urunSatirlari)?.kaynak ?? borsalar[0] ?? null;
  const borsa = borsaSecim && borsalar.includes(borsaSecim) ? borsaSecim : varsayilanBorsa;

  // 1.3: grafik SADECE seçili borsanın serisini çizer — borsalar karışmaz
  const seri = urunSatirlari.filter((g) => g.borsa === borsa);
  const grafikVeri = seri.map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.ortalama ?? 0, en_az: g.en_az ?? 0, en_cok: g.en_cok ?? 0 }));
  const gunSayisi = distinctGun(seri);

  // Başlık fiyatı: seçili borsanın en güncel satırı
  const guncelSatir = [...seri].sort((a, b) => b.cekilme_tarihi.localeCompare(a.cekilme_tarihi))[0];
  const sf = sonFiyatlar.find((f) => f.urun_norm === secilen);
  const renk = YEM_RENK[secilen] ?? RENKLER.green;

  return (
    <div>
      {/* Ürün butonları */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        {sonFiyatlar.map((f) => {
          const r = YEM_RENK[f.urun_norm] ?? RENKLER.green;
          const aktif = f.urun_norm === secilen;
          return (
            <button
              key={f.urun_norm}
              onClick={() => { setSecilen(f.urun_norm); setBorsaSecim(null); }}
              style={{ padding: "5px 12px", fontSize: "11px", background: aktif ? r : RENKLER.surface, color: aktif ? "#000" : RENKLER.muted, border: `1px solid ${aktif ? r : RENKLER.border}`, borderRadius: "3px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            >
              {f.urun_norm}
            </button>
          );
        })}
      </div>

      {/* Borsa seçici (1.3 opsiyonel): tek seri, seçilen borsa */}
      {borsalar.length > 1 && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "14px" }}>
          {borsalar.map((b) => {
            const aktif = b === borsa;
            return (
              <button
                key={b}
                onClick={() => setBorsaSecim(b)}
                style={{ padding: "3px 10px", fontSize: "10px", background: aktif ? "#1A3020" : "transparent", color: aktif ? RENKLER.text : RENKLER.muted, border: `1px solid ${aktif ? RENKLER.green : RENKLER.border}`, borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-mono)" }}
              >
                {b}
              </button>
            );
          })}
        </div>
      )}

      {/* Anlık fiyat — seçili borsanın en güncel değeri */}
      {guncelSatir && (
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "36px", color: renk, fontWeight: 700, lineHeight: 1 }}>{formatFiyat(guncelSatir.ortalama)}</span>
          <span style={{ fontSize: "13px", color: RENKLER.muted }}>TL/KG</span>
          <span style={{ fontSize: "11px", color: RENKLER.muted }}>{borsa} · {guncelSatir.cekilme_tarihi}</span>
          <VeriTazelik tarih={guncelSatir.cekilme_tarihi} />
        </div>
      )}

      {/* Grafik */}
      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "12px" }}>
        <div style={{ fontSize: "10px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.1em" }}>
          30 GÜN TARİHÇE · {gunSayisi}/30 gün{borsa ? ` · ${borsa}` : ""}
        </div>
        <FiyatGrafik data={grafikVeri} renk={renk} birim="TL/KG" urun_ad={sf?.urun_ad ?? secilen} kaynakEtiket={borsa ?? undefined} />
      </div>
    </div>
  );
}
