"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatFiyat } from "@/lib/format";
import { kartUretilebilir } from "@/lib/tazelik";
import PaylasButonlar from "./PaylasButonlar";

export interface UrunItem {
  norm: string;
  ad: string;
  renk: string;
  son: number;
  tip: "yem" | "hayvan";
  tarih?: string | null;       // canlı fiyatın tarihi — kart bayatlık guard'ı
  karkasKg?: number;
  karkasLabel?: string;
}
export interface VarlikItem {
  ad: string;
  ikon: string;
  birim: string;
  renk: string;
  aciklama: string;
  fiyat: number;
  hist: { y: string; f: number }[];
}

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", pos: "#4AE870", neg: "#E84A4A" };

function TT({ active, payload, label, sfx = "" }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string; sfx?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: C.mut, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: C.txt }}>{p.name}: <b style={{ color: p.color || C.txt }}>{typeof p.value === "number" ? p.value.toLocaleString("tr-TR") : p.value}{sfx}</b></div>
      ))}
    </div>
  );
}

function Kart({ renk, children, onClick }: { renk: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 12, padding: 14, cursor: onClick ? "pointer" : "default", position: "relative", overflow: "hidden", transition: "border-color 0.15s" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: renk, borderRadius: "12px 0 0 12px" }} />
      <div style={{ paddingLeft: 8 }}>{children}</div>
    </div>
  );
}

export default function HedefClient({ urunler, varliklar }: { urunler: UrunItem[]; varliklar: Record<string, VarlikItem> }) {
  const yemler = urunler.filter((u) => u.tip === "yem");
  const hayvanlar = urunler.filter((u) => u.tip === "hayvan");
  const ilkUrun = yemler[0]?.norm ?? hayvanlar[0]?.norm ?? "";

  const [urun, setUrun] = useState(ilkUrun);
  const [varlik, setVarlik] = useState("traktor");
  const [miktar, setMiktar] = useState(10);

  const u = urunler.find((x) => x.norm === urun);
  const v = varliklar[varlik];

  if (!u || !v) {
    return (
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.mut, fontFamily: "monospace" }}>
        Ürün/varlık verisi bulunamadı. Fiyatlar çekildikten sonra görünür.
      </div>
    );
  }

  const hayvanMi = u.tip === "hayvan";
  const karkasKg = u.karkasKg ?? 1;
  const olcek = hayvanMi ? karkasKg : 1000; // baş→karkas kg, ton→1000 kg

  const toplamGelir = u.son * miktar * olcek;
  const miktarBirimi = hayvanMi ? "baş" : "ton";
  // 3.5: çarpanlar okunur sırada — miktar × birim dönüşümü × birim fiyat
  const aciklamaMetni = hayvanMi
    ? `${miktar} baş × ${karkasKg} kg karkas × ${formatFiyat(u.son)} ₺/kg = ${formatFiyat(Math.round(toplamGelir), 0)} ₺`
    : `${miktar} ton × 1.000 kg × ${formatFiyat(u.son)} ₺/kg = ${formatFiyat(Math.round(toplamGelir), 0)} ₺`;

  const karsilik = varlik === "traktor"
    ? (toplamGelir / v.fiyat * 100).toFixed(2)
    : (toplamGelir / v.fiyat).toFixed(1);
  const karsilikBirim = varlik === "traktor" ? "%" : "m²";

  const kacBirim = varlik === "traktor"
    ? (v.fiyat / (u.son * olcek)).toFixed(hayvanMi ? 0 : 1)
    : null;

  const tarihsel = v.hist.map((h) => ({
    y: h.y,
    deger: +(h.f / (u.son * olcek)).toFixed(hayvanMi ? 0 : 1),
  }));

  return (
    <div style={{ fontFamily: "'Courier New',monospace", color: C.txt, maxWidth: 1200, margin: "0 auto", padding: 4 }}>
      <style>{`select option{background:#0A140C;}`}</style>

      {/* Panel */}
      <div style={{ background: "#0A1810", border: "1px solid #1A4028", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#5FBF80", letterSpacing: 2, marginBottom: 16 }}>🎯 ÜRETİCİ HEDEF PANELİ — KONYA</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.mut, marginBottom: 4 }}>ÜRÜN</div>
            <select value={urun} onChange={(e) => setUrun(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "8px 10px", color: C.txt, fontSize: 12, fontFamily: "monospace", outline: "none" }}>
              {yemler.length > 0 && (
                <optgroup label="Tahıllar & Yem">
                  {yemler.map((y) => <option key={y.norm} value={y.norm}>{y.ad}</option>)}
                </optgroup>
              )}
              {hayvanlar.length > 0 && (
                <optgroup label="Hayvan">
                  {hayvanlar.map((h) => <option key={h.norm} value={h.norm}>{h.ad}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.mut, marginBottom: 4 }}>HEDEF VARLIK</div>
            <select value={varlik} onChange={(e) => setVarlik(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "8px 10px", color: C.txt, fontSize: 12, fontFamily: "monospace", outline: "none" }}>
              {Object.entries(varliklar).map(([k, val]) => <option key={k} value={k}>{val.ikon} {val.ad}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.mut, marginBottom: 4 }}>MİKTAR ({miktarBirimi.toUpperCase()})</div>
            <input type="number" value={miktar} min={1} onChange={(e) => setMiktar(Math.max(1, +e.target.value || 1))} style={{ width: "100%", background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "8px 10px", color: C.txt, fontSize: 16, fontFamily: "monospace", outline: "none" }} />
            {hayvanMi && <div style={{ fontSize: 12, color: "#6B9478", marginTop: 4 }}>{u.karkasLabel}</div>}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 16 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div style={{ fontSize: 12, color: C.mut, marginBottom: 3 }}>{miktar} {miktarBirimi} {u.ad.toUpperCase()} =</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: v.renk, letterSpacing: -1 }}>
                {formatFiyat(Number(karsilik), varlik === "traktor" ? 2 : 1)}
                <span style={{ fontSize: 14, color: C.mut, marginLeft: 5, fontWeight: 400 }}>{karsilikBirim} {v.ad.toLowerCase()}</span>
              </div>
            </div>
            {kacBirim && (
              <div>
                <div style={{ fontSize: 12, color: C.mut, marginBottom: 3 }}>1 {v.ad.toUpperCase()} İÇİN</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#E86040", letterSpacing: -1 }}>
                  {formatFiyat(Number(kacBirim), hayvanMi ? 0 : 1)}
                  <span style={{ fontSize: 14, color: C.mut, marginLeft: 5, fontWeight: 400 }}>{miktarBirimi} {u.ad.toLowerCase()}</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#3A7040", marginTop: 8 }}>{aciklamaMetni} · {v.aciklama}</div>

          {/* Paylaşım: "1 varlık = X ton/baş ürün" kartı — bayat veride PNG pasif (KARAR) */}
          <div style={{ marginTop: 14 }}>
            <PaylasButonlar
              metin={`${v.ikon} 1 ${v.ad.toLowerCase()} = ${formatFiyat(v.fiyat / (u.son * olcek), hayvanMi ? 0 : 1)} ${miktarBirimi} ${u.ad.toLowerCase()}\n${u.ad} ${formatFiyat(u.son)} ₺/kg (canlı borsa)${hayvanMi ? ` · karkas ~${karkasKg} kg (tahmin)` : ""} · ${v.ad} ${formatFiyat(v.fiyat, 0)} ₺ (referans)\nhttps://borsanadolu.6ngen.com/hedef`}
              pngUrl={kartUretilebilir(u.tarih) ? `/api/kart/hedef?urun=${u.norm}&varlik=${varlik}` : null}
            />
          </div>
        </div>
      </div>

      {/* Varlık kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 20 }}>
        {Object.entries(varliklar).map(([k, val]) => {
          const birimGelir = u.son * olcek; // 1 ton/baş gelir
          const etiket = k === "traktor"
            ? `${formatFiyat(val.fiyat / birimGelir, hayvanMi ? 0 : 1)} ${miktarBirimi} gerekli`
            : `1 ${miktarBirimi} = ${formatFiyat(birimGelir / val.fiyat, 1)} m²`;
          return (
            <Kart key={k} renk={val.renk} onClick={() => setVarlik(k)}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{val.ikon}</div>
              <div style={{ fontSize: 12, color: C.mut, marginBottom: 3 }}>{val.ad.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: varlik === k ? val.renk : C.txt }}>{etiket}</div>
              <div style={{ fontSize: 12, color: "#6B9478", marginTop: 3 }}>{val.aciklama}</div>
            </Kart>
          );
        })}
      </div>

      {/* Tarihsel grafik */}
      <div style={{ background: C.surf, border: `1px solid ${C.brd}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 12, color: C.mut, letterSpacing: 1, marginBottom: 12 }}>
          TARİHSEL — 1 {v.ikon} {v.ad.toUpperCase()} İÇİN KAÇ {miktarBirimi.toUpperCase()} {u.ad.toUpperCase()}?
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={tarihsel} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#142018" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="y" tick={{ fill: C.mut, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.mut, fontSize: 12 }} axisLine={false} tickLine={false} />
            {/* 3.6: hover'daki gri bant (varsayılan cursor) kaldırıldı — ikinci bar gibi okunuyordu */}
          <Tooltip content={<TT sfx={` ${miktarBirimi}`} />} cursor={{ fill: "transparent" }} />
            <Bar dataKey="deger" fill={v.renk} radius={[4, 4, 0, 0]} name={miktarBirimi} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 8 }}>
          Güncel ürün fiyatı canlı borsa verisidir (TOBB/ESK) · Varlık fiyatları Konya referans serisi (TÜİK/manuel)
        </div>
      </div>
    </div>
  );
}
