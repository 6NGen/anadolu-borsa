"use client";
import { useState, useEffect } from "react";
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Snowflake, Sun } from "lucide-react";
import { IL_KOORDINAT } from "@/lib/il-koordinat";
import { useBolgem } from "@/lib/bolgem";

function HavaIkon({ kod }: { kod: number }) {
  const ozellik = { size: 18, strokeWidth: 1.8 };
  if (kod === 0) return <Sun {...ozellik} color="#E9B949" />;
  if (kod <= 2) return <CloudSun {...ozellik} color="var(--muted)" />;
  if (kod <= 45) return <Cloud {...ozellik} color="var(--muted)" />;
  if (kod <= 67) return <CloudRain {...ozellik} color="#70A8E8" />;
  if (kod <= 77) return <Snowflake {...ozellik} color="#5B9BD5" />;
  if (kod <= 82) return <CloudDrizzle {...ozellik} color="#70A8E8" />;
  return <CloudLightning {...ozellik} color="#E9B949" />;
}

const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

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
  const [bolgem] = useBolgem();
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

  const ilAd = il.charAt(0) + il.slice(1).toLocaleLowerCase("tr");

  return (
    <div className="ab-card" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
        <span className="ab-eyebrow">Hava · {ilAd}</span>
        <span style={{ fontSize: "12px", color: "var(--faint)" }}>7 gün</span>
      </div>

      {yukleniyor ? (
        <div style={{ color: "var(--muted)", fontSize: "13px", padding: "24px 0", textAlign: "center" }}>Yükleniyor…</div>
      ) : hava ? (
        <div style={{ display: "grid" }}>
          {hava.time.slice(0, 7).map((tarih, i) => {
            const gun = i === 0 ? "Bugün" : GUN_KISA[new Date(tarih + "T12:00:00").getDay()];
            const yagis = hava.precipitation_sum[i];
            return (
              <div key={tarih} style={{ display: "grid", gridTemplateColumns: "52px 26px 1fr auto", alignItems: "center", gap: "8px", padding: "7px 0", borderTop: i ? "1px solid var(--border)" : undefined, fontSize: "13.5px" }}>
                <span style={{ color: i === 0 ? "var(--text)" : "var(--muted)", fontWeight: i === 0 ? 600 : 500 }}>{gun}</span>
                <HavaIkon kod={hava.weathercode[i]} />
                <span style={{ fontSize: "12px", color: "#70A8E8" }}>{yagis > 0 ? `${yagis} mm` : ""}</span>
                <span className="ab-num" style={{ whiteSpace: "nowrap" }}>
                  <b style={{ fontWeight: 650 }}>{Math.round(hava.temperature_2m_max[i])}°</b>
                  <span style={{ color: "var(--faint)", marginLeft: "8px" }}>{Math.round(hava.temperature_2m_min[i])}°</span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>Hava verisi alınamadı</div>
      )}

      <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
        Kaynak: Open-Meteo · bölgeni üst menüden değiştir
      </div>
    </div>
  );
}
