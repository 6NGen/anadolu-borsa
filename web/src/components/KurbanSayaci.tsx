"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

// Kurban Bayramı 1. gün tarihleri (Diyanet) — sonraki bayrama geri sayım
const KURBAN_TARIHLERI = [
  "2026-05-27",
  "2027-05-16",
  "2028-05-05",
  "2029-04-24",
  "2030-04-13",
];

const GORUNUR_GUN = 90;

function sonrakiKurban(): Date {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  for (const t of KURBAN_TARIHLERI) {
    const d = new Date(t + "T00:00:00");
    if (d.getTime() >= bugun.getTime()) return d;
  }
  return new Date(KURBAN_TARIHLERI[KURBAN_TARIHLERI.length - 1] + "T00:00:00");
}

export default function KurbanSayaci() {
  const [kalan, setKalan] = useState<{ gun: number; saat: number; dakika: number; saniye: number } | null>(null);
  const [hedef, setHedef] = useState<Date | null>(null);

  useEffect(() => {
    const h = sonrakiKurban();
    setHedef(h);
    const guncelle = () => {
      const fark = h.getTime() - Date.now();
      const gun = Math.floor(fark / 86400000);
      const saat = Math.floor((fark % 86400000) / 3600000);
      const dakika = Math.floor((fark % 3600000) / 60000);
      const saniye = Math.floor((fark % 60000) / 1000);
      setKalan({ gun, saat, dakika, saniye });
    };
    guncelle();
    const id = setInterval(guncelle, 1000);
    return () => clearInterval(id);
  }, []);

  // Yalnız son 90 günde görünür: aylar önceden saniyeli geri sayım gürültüdür
  if (!kalan || !hedef || kalan.gun > GORUNUR_GUN) return null;

  const Birim = ({ deger, etiket }: { deger: number; etiket: string }) => (
    <div style={{ textAlign: "center", minWidth: "48px" }}>
      <div className="ab-num" style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1 }}>{String(deger).padStart(2, "0")}</div>
      <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "4px" }}>{etiket}</div>
    </div>
  );

  return (
    <Link href="/hayvan" className="ab-card ab-card-hover" style={{ textDecoration: "none", color: "inherit", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-soft)", color: "var(--green)", display: "grid", placeItems: "center" }}><CalendarDays size={20} /></span>
        <div>
          <div style={{ fontSize: "14.5px", fontWeight: 600 }}>Kurban Bayramı&apos;na kalan süre</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--muted)" }}>
            {hedef.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} · hayvan fiyatları <ArrowRight size={13} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <Birim deger={kalan.gun} etiket="gün" />
        <Birim deger={kalan.saat} etiket="saat" />
        <Birim deger={kalan.dakika} etiket="dakika" />
      </div>
    </Link>
  );
}
