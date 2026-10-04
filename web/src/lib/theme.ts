// Tasarım sistemi renkleri — app/globals.css :root değişkenleriyle AYNI (2026-10).
export const RENKLER = {
  bg:       "#0B100D",
  inset:    "#0E1511",
  surface:  "#121A15",
  surface2: "#17211B",
  border:   "#223029",
  border2:  "#2E3F35",
  muted:    "#94A89B",
  faint:    "#6E8276",
  text:     "#E8EFEA",
  green:    "#4CC38A",
  red:      "#F07167",
  pos:      "#4CC38A",
  neg:      "#F07167",
  warn:     "#E9B949",
} as const;

export const YEM_RENK: Record<string, string> = {
  ARPA:   "#E8A838",
  BUGDAY: "#C4722A",
  MISIR:  "#F0D060",
  SAMAN:  "#A0B878",
  YONCA:  "#68B890",
  YULAF:  "#D4A0C0",
  CAVDAR: "#B8907A",
};

export const HAYVAN_RENK: Record<string, string> = {
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
