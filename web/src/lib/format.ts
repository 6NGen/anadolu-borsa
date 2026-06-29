// Tek noktadan tr-TR sayı biçimlendirme: binlik nokta, ondalık virgül (1.234,56).
// Sitedeki TÜM fiyat/oran gösterimleri bu fonksiyondan geçer (toFixed kullanma).
const cache = new Map<number, Intl.NumberFormat>();

export function formatFiyat(n: number | null | undefined, ondalik = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  let nf = cache.get(ondalik);
  if (!nf) {
    nf = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: ondalik,
      maximumFractionDigits: ondalik,
    });
    cache.set(ondalik, nf);
  }
  return nf.format(n);
}

// Kullanıcı girdisi: hem "14,50" hem "14.50" kabul edilir.
export function parseFiyatGirdi(s: string): number {
  return parseFloat(s.trim().replace(",", "."));
}

// Parite/oran için kademeli ondalık — küçük sonuç 0 göstermesin (matris hücresi).
// ≥100→tam · ≥10→1 · ≥1→2 · ≥0,01→3 · >0→5 hane · geçersiz/0 → "—"
export function oranBicim(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  const d = n >= 100 ? 0 : n >= 10 ? 1 : n >= 1 ? 2 : n >= 0.01 ? 3 : 5;
  return formatFiyat(n, d);
}

// "2026-06-11" → "11.06"
export function kisaTarih(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [, ay, gun] = iso.slice(0, 10).split("-");
  return `${gun}.${ay}`;
}
