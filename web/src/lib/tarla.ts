// Sanal Tarla ürün varyantları — her ürünün KENDİ ekim/hasat sezonu.
// Aynı urun_norm farklı sezonlarda ekilebilir (güzlük/yazlık buğday).
// Açılış yalnız ekim sezonunda, hasat yalnız hasat sezonunda → "anında hasat" yok.
// Kaynak: il tarım müdürlükleri / TÜİK ortalama dönemleri.

export interface TarlaUrun {
  key: string;       // varyant anahtarı (sanal_tarla'da saklanır)
  ad: string;        // gösterim
  urunNorm: string;  // fiyatlama için borsa normu
  emoji: string;
  ekimAylar: number[];   // 1-12
  hasatAylar: number[];
}

export const TARLA_URUNLER: TarlaUrun[] = [
  { key: "guzluk_bugday", ad: "Güzlük Buğday", urunNorm: "BUGDAY", emoji: "🌾", ekimAylar: [10, 11], hasatAylar: [6, 7] },
  { key: "yazlik_bugday", ad: "Yazlık Buğday", urunNorm: "BUGDAY", emoji: "🌾", ekimAylar: [3, 4], hasatAylar: [8, 9] },
  { key: "arpa", ad: "Arpa", urunNorm: "ARPA", emoji: "🌾", ekimAylar: [10, 11], hasatAylar: [5, 6] },
  { key: "yulaf", ad: "Yulaf", urunNorm: "YULAF", emoji: "🌾", ekimAylar: [3, 4], hasatAylar: [7, 8] },
  { key: "misir", ad: "Mısır", urunNorm: "MISIR", emoji: "🌽", ekimAylar: [4, 5, 6, 7], hasatAylar: [9, 10, 11] },
];

export const tarlaUrunBul = (key: string) => TARLA_URUNLER.find((u) => u.key === key) ?? null;

const AY_AD = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function aylarMetni(aylar: number[]): string {
  if (aylar.length === 1) return AY_AD[aylar[0]];
  return `${AY_AD[aylar[0]]}–${AY_AD[aylar[aylar.length - 1]]}`;
}

export function buAy(d = new Date()): number {
  return d.getMonth() + 1;
}

export const ayIcinde = (aylar: number[], d = new Date()) => aylar.includes(buAy(d));
