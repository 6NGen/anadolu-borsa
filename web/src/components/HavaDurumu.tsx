"use client";
import { useState, useEffect } from "react";
import { RENKLER } from "@/lib/theme";
import { ILLER } from "@/lib/iller";
import { IL_KOORDINAT } from "@/lib/il-koordinat";
import { useBolgem } from "@/lib/bolgem";

function weatherIcon(code: number): string {
  if (code === 0) return "☀";
  if (code <= 2)  return "⛅";
  if (code <= 45) return "☁";
  if (code <= 67) return "🌧";
  if (code <= 77) return "❄";
  if (code <= 82) return "🌦";
  return "⛈";
}

interface DailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  windspeed_10m_max: number[];
  weathercode: number[];
}

export default function HavaDurumu() {
  // İl, bölgem'den gelir (M1); seçimi değiştirmek bölgem'i günceller → tek kaynak.
  // Koordinatı olmayan/null bölgem → KONYA varsayılan.
  const [bolgem, setBolgem] = useBolgem();
  const il = bolgem && IL_KOORDINAT[bolgem] ? bolgem : "KONYA";
  const [hava, setHava] = useState<DailyData | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    const { lat, lon } = IL_KOORDINAT[il];
    setYukleniyor(true);
    fetch(`/api/hava?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => setHava(d.daily ?? null))
      .catch(() => setHava(null))
      .finally(() => setYukleniyor(false));
  }, [il]);

  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em" }}>HAVA DURUMU</span>
        <select
          value={il}
          onChange={(e) => setBolgem(e.target.value)}
          style={{ background: "#080E09", border: `1px solid ${RENKLER.border}`, color: RENKLER.text, fontSize: "10px", padding: "2px 6px", borderRadius: "3px", cursor: "pointer" }}
        >
          {ILLER.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {yukleniyor ? (
        <div style={{ color: RENKLER.muted, fontSize: "11px", padding: "16px 0", textAlign: "center" }}>Yükleniyor…</div>
      ) : hava ? (
        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
          {hava.time.slice(0, 7).map((tarih, i) => (
            <div key={tarih} style={{ flexShrink: 0, textAlign: "center", padding: "8px 6px", background: "#080E09", borderRadius: "3px", minWidth: "52px" }}>
              <div style={{ fontSize: "9px", color: RENKLER.muted }}>{tarih.slice(5)}</div>
              <div style={{ fontSize: "16px", margin: "3px 0" }}>{weatherIcon(hava.weathercode[i])}</div>
              <div style={{ fontSize: "12px", color: RENKLER.text, fontWeight: 600 }}>{Math.round(hava.temperature_2m_max[i])}°</div>
              <div style={{ fontSize: "10px", color: RENKLER.muted }}>{Math.round(hava.temperature_2m_min[i])}°</div>
              {hava.precipitation_sum[i] > 0 && (
                <div style={{ fontSize: "9px", color: "#70A8E8", marginTop: "2px" }}>{hava.precipitation_sum[i]}mm</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: RENKLER.muted, fontSize: "11px", textAlign: "center", padding: "16px 0" }}>Hava verisi alınamadı</div>
      )}

      <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "8px", paddingTop: "6px", borderTop: `1px solid ${RENKLER.border}` }}>
        Kaynak: Open-Meteo · Bilgilendirme amaçlıdır
      </div>
    </div>
  );
}
