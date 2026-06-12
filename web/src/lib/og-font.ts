// ImageResponse (Satori) için font yükleyici.
// Varsayılan font Türkçe karakterleri (ğ, ş, İ, ö...) kapsamaz.
// ÖNEMLİ: subset woff'lar (latin + latin-ext) aynı isim/weight ile verilince
// Satori birini eziyor → yamalı görünüm. Çözüm: KOMPLE tek TTF (tüm glifler).
// Runtime'da çekilir, modül seviyesinde cache'lenir (instance başına 1 indirme).

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/IBM/plex@6.0.0/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Bold.ttf";

let cache: Promise<ArrayBuffer> | null = null;

export function ogFont(): Promise<ArrayBuffer> {
  if (!cache) {
    cache = fetch(FONT_URL).then((r) => {
      if (!r.ok) throw new Error(`Font indirilemedi: ${r.status}`);
      return r.arrayBuffer();
    });
  }
  return cache;
}

export async function ogFontConfig() {
  const data = await ogFont();
  return [{ name: "IBM Plex Mono", data, weight: 700 as const, style: "normal" as const }];
}
