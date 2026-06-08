"use client";
import { useEffect, useState } from "react";
import { RENKLER } from "@/lib/theme";

export default function SaatGosterg() {
  const [saat, setSaat] = useState("");
  useEffect(() => {
    const update = () =>
      setSaat(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return <span style={{ fontSize: "11px", color: RENKLER.muted, fontVariantNumeric: "tabular-nums" }}>{saat}</span>;
}
