"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { RENKLER, HAYVAN_RENK } from "@/lib/theme";

export interface PariteNokta {
  tarih: string;
  sut: number | null;
  kuzu: number | null;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, padding: "8px 12px", fontSize: "11px" }}>
      <div style={{ color: RENKLER.muted, marginBottom: "4px" }}>{label?.slice(0, 10)}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(3)}
        </div>
      ))}
    </div>
  );
}

export default function PariteGrafik({ data }: { data: PariteNokta[] }) {
  if (!data?.length) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: RENKLER.muted, fontSize: "12px" }}>
        Grafik verisi yok
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={RENKLER.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="tarih" tick={{ fontSize: 10, fill: RENKLER.muted }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v?.slice(0, 7)} />
        <YAxis tick={{ fontSize: 10, fill: RENKLER.muted }} tickLine={false} axisLine={false} width={42} tickFormatter={(v: number) => v.toFixed(1)} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line type="monotone" dataKey="sut" name="Mazot/Süt" stroke={HAYVAN_RENK.SUT} strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="kuzu" name="Mazot/Kuzu" stroke={HAYVAN_RENK.KUZU} strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
