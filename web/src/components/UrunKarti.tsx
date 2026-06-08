"use client";
import Link from "next/link";
import { RENKLER } from "@/lib/theme";

interface Props {
  urun_norm: string;
  urun_ad: string;
  renk: string;
  ortalama: number | null;
  en_az: number | null;
  en_cok: number | null;
  borsa: string;
  tarih: string;
  birim: string;
}

export default function UrunKarti({ urun_norm, urun_ad, renk, ortalama, en_az, en_cok, borsa, tarih, birim }: Props) {
  return (
    <Link href={`/urun/${urun_norm.toLowerCase()}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px", display: "flex", gap: "10px", transition: "border-color 0.15s", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = renk)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = RENKLER.border)}
      >
        <div style={{ width: "3px", background: renk, borderRadius: "2px", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "9px", color: RENKLER.muted, letterSpacing: "0.12em" }}>{urun_norm}</div>
          <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600, margin: "2px 0" }}>{urun_ad}</div>
          <div style={{ fontSize: "22px", color: renk, fontWeight: 700, lineHeight: 1 }}>
            {ortalama != null ? ortalama.toFixed(2) : "—"}
          </div>
          <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "2px" }}>{birim}</div>
          {en_az != null && en_cok != null && (
            <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "4px" }}>
              ↓{en_az.toFixed(2)} ↑{en_cok.toFixed(2)}
            </div>
          )}
          <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${RENKLER.border}` }}>
            {borsa} · {tarih}
          </div>
        </div>
      </div>
    </Link>
  );
}
