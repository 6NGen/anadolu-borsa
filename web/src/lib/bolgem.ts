"use client";
// "Bölgem": auth'suz kişiselleştirme. localStorage + custom event ile tüm
// client bileşenler aynı il değerini paylaşır. Sunucu tarafı bilmez (kişisel).
import { useState, useEffect } from "react";

const ANAHTAR = "bolgem";
const OLAY = "bolgem-degisti";

export function getBolgem(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ANAHTAR);
}

export function setBolgem(il: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANAHTAR, il);
  window.dispatchEvent(new CustomEvent(OLAY, { detail: il }));
}

// Türkçe il adını borsa/koordinat eşlemesi için ASCII'ye indirger
// (scraper normalize ile aynı: ESKİŞEHİR → ESKISEHIR, ÇORUM → CORUM).
export function ilAscii(il: string): string {
  const harita: Record<string, string> = {
    "İ": "I", "Ğ": "G", "Ü": "U", "Ş": "S", "Ö": "O", "Ç": "C",
    "ı": "I", "ğ": "G", "ü": "U", "ş": "S", "ö": "O", "ç": "C",
  };
  return [...il.toUpperCase()].map((c) => harita[c] ?? c).join("");
}

// bölgem değerini okuyan + değişimini (aynı sekme: event, diğer sekme: storage)
// dinleyen hook. İlk render'da null döner (SSR/hydration güvenli), effect'te dolar.
export function useBolgem(): [string | null, (il: string) => void] {
  const [il, setIl] = useState<string | null>(null);
  useEffect(() => {
    setIl(getBolgem());
    const elIci = (e: Event) => setIl((e as CustomEvent).detail ?? getBolgem());
    const sekmeArasi = (e: StorageEvent) => { if (e.key === ANAHTAR) setIl(e.newValue); };
    window.addEventListener(OLAY, elIci);
    window.addEventListener("storage", sekmeArasi);
    return () => {
      window.removeEventListener(OLAY, elIci);
      window.removeEventListener("storage", sekmeArasi);
    };
  }, []);
  return [il, setBolgem];
}
