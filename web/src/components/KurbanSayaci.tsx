"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RENKLER } from "@/lib/theme";

// Kurban Bayramı 1. gün tarihleri (Diyanet) — sonraki bayrama geri sayım
const KURBAN_TARIHLERI = [
  "2026-05-27",
  "2027-05-16",
  "2028-05-05",
  "2029-04-24",
  "2030-04-13",
];

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

  if (!kalan || !hedef) return null;

  const Birim = ({ deger, etiket }: { deger: number; etiket: string }) => (
    <div style={{ textAlign: "center", minWidth: "52px" }}>
      <div style={{ fontSize: "26px", fontWeight: 700, color: RENKLER.text, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
        {String(deger).padStart(2, "0")}
      </div>
      <div style={{ fontSize: "9px", color: RENKLER.muted, letterSpacing: "0.1em", marginTop: "4px" }}>{etiket}</div>
    </div>
  );

  return (
    <Link href="/hayvan" style={{ textDecoration: "none" }}>
      <div style={{ background: "linear-gradient(90deg, #14241A 0%, #0F1A12 100%)", border: `1px solid ${RENKLER.border}`, borderLeft: "3px solid #68B890", borderRadius: "6px", padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "30px" }}>🐑</span>
          <div>
            <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>KURBAN BAYRAMI&apos;NA</div>
            <div style={{ fontSize: "10px", color: RENKLER.muted }}>
              {hedef.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} · canlı hayvan fiyatları →
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Birim deger={kalan.gun} etiket="GÜN" />
          <Birim deger={kalan.saat} etiket="SAAT" />
          <Birim deger={kalan.dakika} etiket="DAKİKA" />
          <Birim deger={kalan.saniye} etiket="SANİYE" />
        </div>
      </div>
    </Link>
  );
}
