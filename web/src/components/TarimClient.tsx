"use client";
import { useState } from "react";
import FiyatGrafik from "./FiyatGrafik";
import VeriTazelik from "./VeriTazelik";
import { YEM_AD } from "@/lib/urun-tanim";
import { kaynakAd } from "@/lib/kaynak-ad";
import PaylasButonlar from "./PaylasButonlar";
import { YEM_RENK, RENKLER, alfa } from "@/lib/theme";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { enGuncelYem, distinctGun } from "@/lib/guncel";
import { kartUretilebilir } from "@/lib/tazelik";
import { useBolgem, ilAscii } from "@/lib/bolgem";

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
  islem_miktari?: number | null; // KG (migration_004 ile view'da); UI ton'a çevirir
}

const DUSUK_HACIM_KG = 20000; // <20 ton = düşük hacim
const tonGoster = (kg?: number | null) =>
  kg != null ? `${formatFiyat(kg / 1000, kg < 10000 ? 1 : 0)} ton` : null;

interface Props {
  sonFiyatlar: SonFiyat[];
  grafik: GrafikVeri[];
}

export default function TarimClient({ sonFiyatlar, grafik }: Props) {
  const [secilen, setSecilen] = useState<string>(sonFiyatlar[0]?.urun_norm ?? "ARPA");
  const [borsaSecim, setBorsaSecim] = useState<string | null>(null);
  const [bolgem] = useBolgem();

  // Seçili ürünün tüm satırları (30 gün, tüm borsalar)
  const urunSatirlari = grafik.filter((g) => g.urun_norm === secilen);
  const borsalar = [...new Set(urunSatirlari.map((g) => g.borsa))].sort();

  // M1: kullanıcının bölgesinin borsası bu üründe varsa öne gelir.
  // Yoksa deterministik en güncel (parite sayfasıyla aynı kural → aynı sayı).
  const bolgeBorsa = bolgem ? borsalar.find((b) => b === ilAscii(bolgem)) ?? null : null;
  const varsayilanBorsa = bolgeBorsa ?? enGuncelYem(urunSatirlari)?.kaynak ?? borsalar[0] ?? null;
  const borsa = borsaSecim && borsalar.includes(borsaSecim) ? borsaSecim : varsayilanBorsa;

  // 1.3: grafik SADECE seçili borsanın serisini çizer — borsalar karışmaz
  const seri = urunSatirlari.filter((g) => g.borsa === borsa);
  const grafikVeri = seri.map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.ortalama ?? 0, en_az: g.en_az ?? 0, en_cok: g.en_cok ?? 0 }));
  const gunSayisi = distinctGun(seri);

  // Başlık fiyatı: seçili borsanın en güncel satırı
  const guncelSatir = [...seri].sort((a, b) => b.cekilme_tarihi.localeCompare(a.cekilme_tarihi))[0];
  const renk = YEM_RENK[secilen] ?? RENKLER.green;

  // M2: borsa karşılaştırması — her borsanın bu ürün için en güncel satırı
  const borsaOzet = borsalar
    .map((b) => {
      const son = [...urunSatirlari.filter((g) => g.borsa === b)].sort((x, y) => y.cekilme_tarihi.localeCompare(x.cekilme_tarihi))[0];
      return son && son.ortalama != null ? { borsa: b, fiyat: son.ortalama, tarih: son.cekilme_tarihi, hacim: son.islem_miktari ?? null } : null;
    })
    .filter((x): x is { borsa: string; fiyat: number; tarih: string; hacim: number | null } => x != null)
    .sort((a, b) => a.fiyat - b.fiyat);
  const fiyatDizi = borsaOzet.map((x) => x.fiyat);
  const fark = fiyatDizi.length > 1 ? ((Math.max(...fiyatDizi) - Math.min(...fiyatDizi)) / Math.min(...fiyatDizi)) * 100 : null;

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
              className="ab-chip"
              style={aktif ? { background: alfa(r, 0.13), color: "var(--text)", borderColor: r, fontWeight: 600 } : undefined}
            >
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: r, marginRight: 7 }} />
              {YEM_AD[f.urun_norm] ?? f.urun_norm}
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
                className="ab-chip"
                style={{ height: "28px", fontSize: "12.5px", ...(aktif ? { background: "var(--green-soft)", color: "var(--text)", borderColor: "var(--green)" } : {}) }}
              >
                {kaynakAd(b)}
              </button>
            );
          })}
        </div>
      )}

      {/* Anlık fiyat — seçili borsanın en güncel değeri */}
      {guncelSatir && (
        <>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "36px", color: renk, fontWeight: 700, lineHeight: 1 }}>{formatFiyat(guncelSatir.ortalama)}</span>
            <span style={{ fontSize: "13px", color: RENKLER.muted }}>TL/KG</span>
            <span style={{ fontSize: "13px", color: RENKLER.muted }}>{kaynakAd(borsa)} · {guncelSatir.cekilme_tarihi}</span>
            <VeriTazelik tarih={guncelSatir.cekilme_tarihi} />
            {guncelSatir.islem_miktari != null && (
              <span style={{ fontSize: "13px", color: RENKLER.muted }}>
                · {tonGoster(guncelSatir.islem_miktari)} işlem
                {guncelSatir.islem_miktari < DUSUK_HACIM_KG && <span style={{ color: "var(--warn)", marginLeft: "6px" }}>⚠ düşük hacim</span>}
              </span>
            )}
          </div>
          {/* Paylaşım: PNG kart bayat veride üretilmez (KARAR), buton pasif gösterilir */}
          <div style={{ marginBottom: "16px" }}>
            <PaylasButonlar
              metin={`${YEM_AD[secilen] ?? secilen} ${formatFiyat(guncelSatir.ortalama)} TL/kg\n${borsa} · ${kisaTarih(guncelSatir.cekilme_tarihi)}\nhttps://borsanadolu.6ngen.com/tarim`}
              pngUrl={kartUretilebilir(guncelSatir.cekilme_tarihi) ? `/api/kart/fiyat?urun=${secilen}` : null}
            />
          </div>
        </>
      )}

      {/* M2: Borsa karşılaştırması — aynı ürün, tüm borsalar */}
      {borsaOzet.length > 1 && (
        <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: RENKLER.muted, letterSpacing: "0.06em" }}>BORSALAR · {YEM_AD[secilen] ?? secilen}</span>
            <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {fark != null && <span style={{ fontSize: "12px", color: RENKLER.muted }}>fark: <b style={{ color: renk }}>%{formatFiyat(fark, 1)}</b></span>}
              {kartUretilebilir(guncelSatir?.cekilme_tarihi) && (
                <button onClick={() => window.open(`/api/kart/borsalar?urun=${secilen}`, "_blank")} style={{ background: "transparent", border: `1px solid ${RENKLER.border}`, color: RENKLER.muted, fontSize: "12px", padding: "3px 9px", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-mono)" }}>Kart</button>
              )}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {borsaOzet.map((x) => (
              <div key={x.borsa} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "7px 9px", background: RENKLER.bg, borderRadius: "12px", border: x.borsa === borsa ? `1px solid ${alfa(renk, 0.33)}` : `1px solid ${RENKLER.border}` }}>
                <span style={{ color: RENKLER.text, fontWeight: 600 }}>{kaynakAd(x.borsa)} <span style={{ fontSize: "12px", color: RENKLER.muted }}>· {kisaTarih(x.tarih)}</span></span>
                <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {x.hacim != null && (
                    <span style={{ fontSize: "12px", color: x.hacim < DUSUK_HACIM_KG ? "var(--warn)" : RENKLER.muted }}>
                      {tonGoster(x.hacim)}{x.hacim < DUSUK_HACIM_KG ? " ⚠" : ""}
                    </span>
                  )}
                  <b style={{ color: renk, fontSize: "14px" }}>{formatFiyat(x.fiyat)} <span style={{ fontSize: "12px", color: RENKLER.muted, fontWeight: 400 }}>₺/kg</span></b>
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: RENKLER.muted, marginTop: "8px", lineHeight: 1.5 }}>
            ⚠ düşük hacim = 20 tondan az işlemle oluşan fiyat; bölgeler arası fark bundan kaynaklanabilir.
          </div>
        </div>
      )}

      {/* Grafik */}
      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "12px", padding: "12px" }}>
        <div style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.06em" }}>
          30 GÜN TARİHÇE · {gunSayisi}/30 gün{borsa ? ` · ${kaynakAd(borsa)}` : ""}
        </div>
        <FiyatGrafik data={grafikVeri} renk={renk} birim="TL/KG" urun_ad={YEM_AD[secilen] ?? secilen} kaynakEtiket={borsa ? kaynakAd(borsa) : undefined} />
      </div>
    </div>
  );
}
