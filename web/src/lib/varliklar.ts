// Hedef varlık referans fiyatları — TEK kaynak: /hedef sayfası ve /api/kart/hedef.
// hedef_varlik_fiyat anon RLS bloklu olduğundan DB seed değerleriyle birebir aynı
// sabitler kullanılır. Bunlar TAHMİN/referans değerlerdir, her gösterimde etiketlenir.
export interface Varlik {
  ad: string;
  ikon: string;
  birim: string;
  renk: string;
  aciklama: string;
  fiyat: number;
  hist: { y: string; f: number }[];
}

export const VARLIKLAR: Record<string, Varlik> = {
  daire: { ad: "Daire", ikon: "🏠", birim: "m²", renk: "#7090E8", aciklama: "100m² Konya orta segment", fiyat: 38000, hist: [{ y: "2015", f: 2800 }, { y: "2018", f: 5500 }, { y: "2020", f: 9000 }, { y: "2022", f: 18000 }, { y: "2024", f: 30000 }, { y: "2026", f: 38000 }] },
  arsa: { ad: "Arsa", ikon: "🏗", birim: "m²", renk: "#E8A040", aciklama: "Konya merkez m²", fiyat: 4500, hist: [{ y: "2015", f: 450 }, { y: "2018", f: 900 }, { y: "2020", f: 1800 }, { y: "2022", f: 2800 }, { y: "2024", f: 3800 }, { y: "2026", f: 4500 }] },
  tarla: { ad: "Tarla", ikon: "🌾", birim: "m²", renk: "#60A870", aciklama: "Konya tarla m²", fiyat: 1180, hist: [{ y: "2015", f: 180 }, { y: "2018", f: 280 }, { y: "2020", f: 450 }, { y: "2022", f: 750 }, { y: "2024", f: 980 }, { y: "2026", f: 1180 }] },
  traktor: { ad: "Traktör", ikon: "🚜", birim: "adet", renk: "#E86040", aciklama: "New Holland T4.90 sıfır", fiyat: 2500000, hist: [{ y: "2010", f: 280000 }, { y: "2015", f: 420000 }, { y: "2018", f: 680000 }, { y: "2020", f: 950000 }, { y: "2022", f: 1600000 }, { y: "2024", f: 2100000 }, { y: "2026", f: 2500000 }] },
};
