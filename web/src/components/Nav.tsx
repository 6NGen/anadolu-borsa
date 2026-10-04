"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell, Calculator, ChevronDown, LogIn, Menu, PenLine, Sprout, Tractor, User, Wheat, X,
} from "lucide-react";
import { useUser } from "@/lib/auth";
import BolgemSecici from "./BolgemSecici";
import Logo from "./Logo";
import TemaDugmesi from "./TemaDugmesi";

// Ana bölümler: her gün bakılan fiyat ekranları
const ANA = [
  { href: "/", label: "Piyasa" },
  { href: "/tarim", label: "Tarım" },
  { href: "/hayvan", label: "Hayvan" },
  { href: "/girdiler", label: "Girdiler" },
  { href: "/parite", label: "Parite" },
];

// Araçlar: hesap/planlama — açıklamalı açılır menü
const ARACLAR = [
  { href: "/maliyet", label: "Ekim Maliyeti", aciklama: "Dekar başına maliyet ve başa baş fiyat", Icon: Calculator },
  { href: "/tarla", label: "Sanal Tarla", aciklama: "Ek, izle, hasat et — fiyatla kâr takibi", Icon: Sprout },
  { href: "/hasat", label: "Hasat Paneli", aciklama: "Hava, 30 günlük trend ve hasat takvimi", Icon: Wheat },
  { href: "/hedef", label: "Hedef Panel", aciklama: "Kaç ton buğday bir traktör eder?", Icon: Tractor },
  { href: "/alarmlar", label: "Fiyat Alarmları", aciklama: "Fiyat eşiği geçince bildirim al", Icon: Bell },
];

export default function Nav() {
  const path = usePathname();
  const { user } = useUser();
  const [mobil, setMobil] = useState(false);
  const [araclar, setAraclar] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const aktif = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const araclarAktif = ARACLAR.some((a) => aktif(a.href));

  const kapat = () => { setMobil(false); setAraclar(false); };

  // Dışarı tıklayınca / Esc ile Araçlar menüsü kapanır
  useEffect(() => {
    if (!araclar) return;
    const tikla = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setAraclar(false); };
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") setAraclar(false); };
    document.addEventListener("mousedown", tikla);
    document.addEventListener("keydown", tus);
    return () => { document.removeEventListener("mousedown", tikla); document.removeEventListener("keydown", tus); };
  }, [araclar]);

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--nav-bg)", backdropFilter: "saturate(140%) blur(12px)",
        WebkitBackdropFilter: "saturate(140%) blur(12px)", borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="ab-container" style={{ display: "flex", alignItems: "center", gap: "8px", height: "60px" }}>
        <Link href="/" aria-label="Anadolu Borsa anasayfa" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginRight: "18px", flexShrink: 0 }}>
          <Logo boyut={30} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>Anadolu Borsa</span>
            <span className="hidden sm:block" style={{ fontSize: "11px", color: "var(--faint)", fontWeight: 500 }}>Tarım ve hayvancılık fiyatları</span>
          </span>
        </Link>

        {/* Masaüstü */}
        <nav className="hidden lg:flex" aria-label="Ana menü" style={{ alignItems: "center", gap: "2px" }}>
          {ANA.map((l) => (
            <Link key={l.href} href={l.href} className="ab-navlink" data-aktif={aktif(l.href) ? "1" : undefined}>
              {l.label}
            </Link>
          ))}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              className="ab-navlink"
              data-aktif={araclarAktif || araclar ? "1" : undefined}
              aria-expanded={araclar}
              aria-haspopup="menu"
              onClick={() => setAraclar((o) => !o)}
            >
              Araçlar
              <ChevronDown size={15} style={{ transition: "transform .15s", transform: araclar ? "rotate(180deg)" : "none" }} />
            </button>
            {araclar && (
              <div className="ab-menu" role="menu">
                {ARACLAR.map(({ href, label, aciklama, Icon }) => (
                  <Link key={href} href={href} role="menuitem" onClick={kapat} data-aktif={aktif(href) ? "1" : undefined}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-soft)", color: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={17} />
                    </span>
                    <span>
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>{label}</span>
                      <span style={{ display: "block", fontSize: "12.5px", color: "var(--muted)", marginTop: "1px" }}>{aciklama}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <BolgemSecici />
          <span className="hidden md:inline-flex"><TemaDugmesi /></span>
          <Link href="/fiyat-bildir" className="ab-btn hidden md:inline-flex">
            <PenLine size={15} /> Fiyat Bildir
          </Link>
          {user ? (
            <Link href="/giris" className="ab-btn ab-btn-ghost hidden md:inline-flex" title="Hesabım" aria-label="Hesabım" style={{ padding: "0 10px" }}>
              <User size={17} />
            </Link>
          ) : (
            <Link href="/giris" className="ab-btn ab-btn-primary hidden md:inline-flex">
              <LogIn size={15} /> Giriş
            </Link>
          )}
          <button
            className="ab-btn ab-btn-ghost lg:hidden"
            onClick={() => setMobil((o) => !o)}
            aria-label={mobil ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobil}
            style={{ padding: "0 8px" }}
          >
            {mobil ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobil / tablet panel */}
      {mobil && (
        <div className="lg:hidden" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)", maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}>
          <div className="ab-container" style={{ paddingTop: "12px", paddingBottom: "20px" }}>
            <div className="ab-eyebrow" style={{ padding: "6px 4px" }}>Piyasalar</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "6px", marginBottom: "14px" }}>
              {ANA.map((l) => (
                <Link key={l.href} href={l.href} onClick={kapat} className="ab-card" style={{
                  padding: "12px 14px", textDecoration: "none", fontWeight: 600, fontSize: "15px",
                  color: aktif(l.href) ? "var(--green)" : "var(--text)",
                  borderColor: aktif(l.href) ? "rgba(76,195,138,.45)" : undefined,
                }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="ab-eyebrow" style={{ padding: "6px 4px" }}>Araçlar</div>
            <div className="ab-card" style={{ padding: "4px", marginBottom: "14px" }}>
              {ARACLAR.map(({ href, label, aciklama, Icon }) => (
                <Link key={href} href={href} onClick={kapat} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "11px 10px", textDecoration: "none", borderRadius: "8px", background: aktif(href) ? "var(--surface-2)" : undefined }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--green-soft)", color: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600, color: "var(--text)" }}>{label}</span>
                    <span style={{ display: "block", fontSize: "12.5px", color: "var(--muted)" }}>{aciklama}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ gridColumn: "1 / -1", display: "grid" }}><TemaDugmesi etiketli /></div>
              <Link href="/fiyat-bildir" onClick={kapat} className="ab-btn" style={{ justifyContent: "center", height: "42px" }}>
                <PenLine size={16} /> Fiyat Bildir
              </Link>
              <Link href="/giris" onClick={kapat} className={user ? "ab-btn" : "ab-btn ab-btn-primary"} style={{ justifyContent: "center", height: "42px" }}>
                {user ? <><User size={16} /> Hesabım</> : <><LogIn size={16} /> Giriş yap</>}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
