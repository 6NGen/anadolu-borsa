// Parite ürünlerinin paylaşılan tanımı: kart route'u ve OG görselleri kullanır.
// (parite/page.tsx kendi TÜİK tarihsel serisiyle birlikte ayrıca tanımlar.)
export interface UrunTanim {
  ad: string;
  ikon: string;
  renk: string;
  birim: string;       // "TL/litre" | "TL/kg"
  norm: string;        // DB norm kodu
  tip: "yem" | "hayvan";
}

export const PARITE_URUNLER: Record<string, UrunTanim> = {
  sut:    { ad: "Çiğ Süt", ikon: "🥛", renk: "#E8F0E0", birim: "TL/litre", norm: "SUT",    tip: "hayvan" },
  arpa:   { ad: "Arpa",    ikon: "🌾", renk: "#D4A843", birim: "TL/kg",    norm: "ARPA",   tip: "yem" },
  kuzu:   { ad: "Kuzu",    ikon: "🐑", renk: "#6890D8", birim: "TL/kg",    norm: "KUZU",   tip: "hayvan" },
  bugday: { ad: "Buğday",  ikon: "🌿", renk: "#B8612A", birim: "TL/kg",    norm: "BUGDAY", tip: "yem" },
  misir:  { ad: "Mısır",   ikon: "🌽", renk: "#E8C040", birim: "TL/kg",    norm: "MISIR",  tip: "yem" },
};

export const SITE_URL = "https://borsanadolu.6ngen.com";
export const SITE_AD = "ANADOLU BORSA";
