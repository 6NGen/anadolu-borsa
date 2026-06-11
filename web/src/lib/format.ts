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

// "2026-06-11" → "11.06"
export function kisaTarih(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [, ay, gun] = iso.slice(0, 10).split("-");
  return `${gun}.${ay}`;
}
