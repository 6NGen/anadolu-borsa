"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RENKLER } from "@/lib/theme";

const LINKS = [
  { href: "/",             label: "Ana" },
  { href: "/tarim",        label: "Tarım" },
  { href: "/hayvan",       label: "Hayvan" },
  { href: "/parite",       label: "Parite" },
  { href: "/hedef",        label: "Hedef" },
  { href: "/fiyat-bildir", label: "Fiyat Bildir" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{ background: RENKLER.surface, borderBottom: `1px solid ${RENKLER.border}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: "4px", height: "48px" }}>
        <span style={{ fontFamily: "var(--font-syne)", color: RENKLER.green, fontWeight: 700, fontSize: "13px", letterSpacing: "0.1em", marginRight: "16px", flexShrink: 0 }}>
          ANADOLU BORSA
        </span>
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: active ? RENKLER.text : RENKLER.muted,
                fontSize: "11px",
                textDecoration: "none",
                padding: "4px 8px",
                borderBottom: active ? `2px solid ${RENKLER.green}` : "2px solid transparent",
                transition: "color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {l.label}
            </Link>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: RENKLER.pos, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "10px", color: RENKLER.muted }}>CANLI</span>
        </div>
      </div>
    </nav>
  );
}
