export const RENKLER = {
  bg:      "#080E09",
  surface: "#0F1A12",
  border:  "#1E3A22",
  muted:   "#506A52",
  text:    "#E8F5EA",
  green:   "#68B890",
  red:     "#E87060",
  pos:     "#4AE870",
  neg:     "#E84A4A",
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

// Ortalama karkas ağırlığı (kg/baş) — "baş hesabı" ve sürü değeri için tahmini değerler
export const KARKAS_KG: Record<string, number> = {
  TOSUN: 225, DANA: 180, INEK: 250, MANDA: 250,
  KUZU: 17, TOKLU: 22, KOYUN: 25, OGLAK: 12,
};
