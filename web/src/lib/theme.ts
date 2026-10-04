// Tasarım sistemi renkleri — DEĞERLER CSS DEĞİŞKENİ (app/globals.css), böylece
// aydınlık/karanlık tema satır içi stillerde de çalışır. Saydamlık için hex'e
// "22" eklemek ARTIK ÇALIŞMAZ → alfa(renk, 0.13) kullan.
// PNG kart üreticileri (app/api/kart, opengraph) CSS değişkeni anlamaz: *_HEX kullanır.
export const RENKLER = {
  bg:       "var(--bg)",
  inset:    "var(--inset)",
  surface:  "var(--surface)",
  surface2: "var(--surface-2)",
  border:   "var(--border)",
  border2:  "var(--border-2)",
  muted:    "var(--muted)",
  faint:    "var(--faint)",
  text:     "var(--text)",
  green:    "var(--green)",
  red:      "var(--red)",
  pos:      "var(--pos)",
  neg:      "var(--neg)",
  warn:     "var(--warn)",
} as const;

// Herhangi bir renge (hex ya da var(--x)) saydamlık: alfa("var(--green)", 0.13)
export function alfa(renk: string, oran: number): string {
  return `color-mix(in srgb, ${renk} ${Math.round(oran * 100)}%, transparent)`;
}

// Ürün renkleri — hex (PNG kartlar) + tema uyumlu arayüz sürümü (--c-<norm>;
// aydınlık temada açık sarı/beyaz tonlar okunur olsun diye koyulaştırılır).
export const YEM_RENK_HEX: Record<string, string> = {
  ARPA:   "#E8A838",
  BUGDAY: "#C4722A",
  MISIR:  "#F0D060",
  SAMAN:  "#A0B878",
  YONCA:  "#68B890",
  YULAF:  "#D4A0C0",
  CAVDAR: "#B8907A",
};

export const HAYVAN_RENK_HEX: Record<string, string> = {
  TOSUN: "#E87060",
  DANA:  "#F09080",
  INEK:  "#D05040",
  KUZU:  "#70A8E8",
  TOKLU: "#5090D0",
  KOYUN: "#4080C0",
  MANDA: "#C07060",
  OGLAK: "#80B870",
  SUT:   "#F0F0E0",
};

const temaRenk = (m: Record<string, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, `var(--c-${k.toLowerCase()}, ${v})`])) as Record<string, string>;

export const YEM_RENK = temaRenk(YEM_RENK_HEX);
export const HAYVAN_RENK = temaRenk(HAYVAN_RENK_HEX);

// Ürün / girdi emojileri (UI süslemesi)
export const EMOJI: Record<string, string> = {
  // yem
  ARPA: "🌾", BUGDAY: "🌾", MISIR: "🌽", SAMAN: "🌿", YONCA: "🍀", YULAF: "🌾", CAVDAR: "🌾",
  // hayvan
  TOSUN: "🐂", DANA: "🐄", INEK: "🐄", MANDA: "🐃", KUZU: "🐑", TOKLU: "🐑", KOYUN: "🐑", OGLAK: "🐐",
  SUT: "🥛",
  // girdi
  mazot: "⛽",
};

export const emoji = (k: string) => EMOJI[k] ?? EMOJI[k?.toUpperCase()] ?? "📦";

// Karkas ağırlıkları lib/karkas.ts'e taşındı (tek kaynak — 2.3 düzeltmesi).
