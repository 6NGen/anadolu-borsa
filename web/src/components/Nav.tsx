"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RENKLER } from "@/lib/theme";
import { useUser } from "@/lib/auth";
import BolgemSecici from "./BolgemSecici";

const LINKS = [
  { href: "/", label: "Anasayfa" },
  { href: "/tarim", label: "Tarım" },
  { href: "/hayvan", label: "Hayvan" },
  { href: "/girdiler", label: "Girdiler" },
  { href: "/parite", label: "Parite" },
  { href: "/hedef", label: "Hedef" },
  { href: "/fiyat-bildir", label: "Fiyat Bildir" },
  { href: "/alarmlar", label: "Alarm" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <nav style={{ background: RENKLER.surface, borderBottom: `1px solid ${RENKLER.border}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: "4px", height: "48px" }}>
        <span style={{ fontFamily: "var(--font-syne)", color: RENKLER.green, fontWeight: 700, fontSize: "13px", letterSpacing: "0.1em", marginRight: "16px", flexShrink: 0 }}>
          ANADOLU BORSA
        </span>

        {/* Masaüstü linkleri */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link key={l.href} href={l.href} style={{
                color: active ? RENKLER.text : RENKLER.muted, fontSize: "11px", textDecoration: "none",
                padding: "4px 8px", borderBottom: active ? `2px solid ${RENKLER.green}` : "2px solid transparent",
                transition: "color 0.15s", whiteSpace: "nowrap",
              }}>
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Sağ: Bölgem + CANLI + hamburger */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <BolgemSecici />
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: RENKLER.pos, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span className="hidden sm:inline" style={{ fontSize: "10px", color: RENKLER.muted }}>CANLI</span>
          </div>
          {/* M2: giriş durumu — giriş yapılmışsa 👤, değilse Giriş linki */}
          <Link href="/giris" title={user ? "Hesabım" : "Giriş yap"} style={{ fontSize: user ? "15px" : "11px", color: user ? RENKLER.text : RENKLER.green, textDecoration: "none", whiteSpace: "nowrap" }}>
            {user ? "👤" : "Giriş"}
          </Link>
          <button
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü"
            aria-expanded={open}
            style={{ background: "transparent", border: "none", color: RENKLER.text, fontSize: "20px", lineHeight: 1, cursor: "pointer", padding: "4px" }}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobil açılır menü */}
      {open && (
        <div className="md:hidden" style={{ borderTop: `1px solid ${RENKLER.border}`, display: "flex", flexDirection: "column", background: RENKLER.surface }}>
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
                color: active ? RENKLER.text : RENKLER.muted, fontSize: "14px", textDecoration: "none",
                padding: "13px 18px", borderLeft: active ? `3px solid ${RENKLER.green}` : "3px solid transparent",
                borderBottom: `1px solid ${RENKLER.border}`,
              }}>
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
