"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { RENKLER } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";

interface Veri {
  tarih: string;
  ortalama: number;
  en_az: number;
  en_cok: number;
}

interface Props {
  data: Veri[];
  renk: string;
  birim: string;
  urun_ad: string;
  kaynakEtiket?: string; // tooltip'te borsa/kaynak adı (1.3)
}

function CustomTooltip({ active, payload, label, kaynakEtiket }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; kaynakEtiket?: string }) {
  if (!active || !payload?.length) return null;
  const degerler = payload.map((p) => p.value);
  const hepsiAyni = degerler.every((v) => v === degerler[0]); // 2.7: min=ort=max tek satır
  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, padding: "8px 12px", fontSize: "11px" }}>
      <div style={{ color: RENKLER.muted, marginBottom: "4px" }}>
        {label}{kaynakEtiket ? ` · ${kaynakEtiket}` : ""}
      </div>
      {hepsiAyni ? (
        <div style={{ color: payload[0].color }}>Fiyat: {formatFiyat(degerler[0])} TL</div>
      ) : (
        payload.map((p) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {formatFiyat(p.value)} TL
          </div>
        ))
      )}
    </div>
  );
}

export default function FiyatGrafik({ data, renk, birim, urun_ad, kaynakEtiket }: Props) {
  if (!data?.length) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: RENKLER.muted, fontSize: "12px" }}>
        Grafik verisi yok — scraper çalıştıktan sonra veri gelecek
      </div>
    );
  }
  const gradId = `grad-${urun_ad.replace(/\s/g, "")}`;
  // Eksen ondalığı: değer bandı darsa 1 hane, genişse tam sayı
  const maxDeger = Math.max(...data.map((d) => d.en_cok || d.ortalama || 0));
  const eksenOndalik = maxDeger < 100 ? 1 : 0;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={renk} stopOpacity={0.25} />
            <stop offset="95%" stopColor={renk} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={RENKLER.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="tarih" tick={{ fontSize: 10, fill: RENKLER.muted }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
        {/* 2.6: y ekseni 0'dan değil, veri bandından başlar — düz çizgi tavana yapışmaz */}
        <YAxis
          tick={{ fontSize: 10, fill: RENKLER.muted }}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={[(min: number) => min * 0.95, (max: number) => max * 1.05]}
          tickFormatter={(v: number) => formatFiyat(v, eksenOndalik)}
        />
        <Tooltip content={<CustomTooltip kaynakEtiket={kaynakEtiket} />} />
        <Area type="monotone" dataKey="en_cok" name="En Çok" stroke={renk} strokeWidth={1} strokeOpacity={0.35} fill={`url(#${gradId})`} dot={false} />
        <Area type="monotone" dataKey="ortalama" name="Ort." stroke={renk} strokeWidth={2} fill="none" dot={false} />
        <Area type="monotone" dataKey="en_az" name="En Az" stroke={renk} strokeWidth={1} strokeOpacity={0.35} fill="none" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
