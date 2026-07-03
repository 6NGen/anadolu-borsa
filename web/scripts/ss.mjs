// Sayfa ekran görüntüsü aracı: node scripts/ss.mjs <port> <path> <cikti.png> [mobil]
import puppeteer from "puppeteer";

const [port = "3479", yol = "/", cikti = "ss.png", mobil] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: "new" });
const p = await b.newPage();
await p.setViewport(mobil ? { width: 390, height: 844, deviceScaleFactor: 2 } : { width: 1280, height: 900 });
await p.goto(`http://localhost:${port}${yol}`, { waitUntil: "networkidle0", timeout: 60000 });
// Recharts animasyonu soğuk başlangıçta 2sn'yi aşabiliyor (2026-07-03 dersi:
// çizgisiz grafik karesi kod hatası sanıldı) — güvenli tampon.
await new Promise((r) => setTimeout(r, 3500));
await p.screenshot({ path: cikti, fullPage: true });
await b.close();
console.log("kaydedildi:", cikti);
