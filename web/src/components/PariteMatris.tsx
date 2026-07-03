"use client";
import { useState } from "react";
import { oranBicim } from "@/lib/format";
import { gunFarki, BAYAT_ESIK_GUN } from "@/lib/tazelik";
import type { Girdi, Urun } from "./PariteClient";

type Yon = "ug" | "gu"; // ürün→girdi (varsayılan) | girdi→ürün
const birimAd = (b: string) => b.replace("TL/", "");

export default function PariteMatris({
  girdiler, urunler, seciliGirdi, seciliUrun, onSec,
}: {
  girdiler: Record<string, Girdi>;
  urunler: Record<string, Urun>;
  seciliGirdi: string;
  seciliUrun: string;
  onSec: (girdi: string, urun: string) => void;
}) {
  const [yon, setYon] = useState<Yon>("gu"); // varsayılan girdi→ürün (temiz/≥1 sayı)
  const [hg, setHg] = useState<string | undefined>();
  const [hu, setHu] = useState<string | undefined>();

  const girdiKeys = Object.keys(girdiler).filter((k) => girdiler[k].aktif);
  const urunKeys = Object.keys(urunler).filter((k) => urunler[k].canli);
  if (girdiKeys.length === 0 || urunKeys.length === 0) return null;

  function hucre(gk: string, uk: string): { deger: string; birim: string; bos: boolean } {
    const g = girdiler[gk], u = urunler[uk];
    if (!(g.guncel > 0) || !(u.guncel > 0)) return { deger: "—", birim: "—", bos: true };
    if (yon === "ug") return { deger: oranBicim(u.guncel / g.guncel), birim: birimAd(g.birim), bos: false };
    return { deger: oranBicim(g.guncel / u.guncel), birim: birimAd(u.birim), bos: false };
  }

  return (
    <div className="pmx">
      <style>{CSS}</style>

      <div className="pmx-head">
        <div className="pmx-eyebrow">Anadolu Borsa</div>
        <h2 className="pmx-h">Parite Matrisi</h2>
        <div className="pmx-alt">Çiftçinin ürünü girdiye karşı kaç ediyor — bütün pariteler tek tabloda.</div>
      </div>

      <div className="pmx-rehber">
        {yon === "ug" ? (
          <>Her hücre: <b>1 birim ürün (satır) = kaç birim girdi (sütun)</b>. Ürünün girdi cinsinden alım gücü.</>
        ) : (
          <>Her hücre: <b>1 birim girdi (sütun) = kaç birim ürün (satır)</b>. Girdinin ürün cinsinden bedeli.</>
        )}
      </div>

      <div className="pmx-secim">
        <span className="et">Yön:</span>
        <button className={yon === "ug" ? "aktif" : ""} onClick={() => setYon("ug")}>Ürün → Girdi</button>
        <button className={yon === "gu" ? "aktif" : ""} onClick={() => setYon("gu")}>Girdi → Ürün</button>
      </div>

      {/* MOBİL (md altı): tablo yerine ürün kartları — yatay kaydırma yok (GÜNCELLEME 1).
          Her satır KENDİ BİRİMLERİYLE tam cümledir: "1 litre motorin = 2,76 litre çiğ süt"
          (saha geri bildirimi: kısaltılmış satır ters okunuyordu). */}
      <div className="pmx-kartlar">
        {urunKeys.map((uk) => {
          const u = urunler[uk];
          const bayat = (gunFarki(u.tarih) ?? 0) >= BAYAT_ESIK_GUN;
          const uAd = u.ad.toLowerCase();
          return (
            <div key={uk} className="pmx-ukart">
              <div className="pmx-ukart-bas">
                <span className="ua">{u.ikon} {u.ad}</span>
                {bayat && <span className="bayat" title="Veri 3+ gün eski">⚠</span>}
              </div>
              {girdiKeys.map((gk) => {
                const g = girdiler[gk];
                const h = hucre(gk, uk);
                const secili = gk === seciliGirdi && uk === seciliUrun;
                const gAd = g.ad.toLowerCase();
                // Sol: baz birim (yöne göre girdi ya da ürün) · Sağ: sonuç kendi cinsiyle
                const sol = yon === "gu" ? `1 ${birimAd(g.birim)} ${gAd}` : `1 ${birimAd(u.birim)} ${uAd}`;
                const sagAd = yon === "gu" ? `${birimAd(u.birim)} ${uAd}` : `${birimAd(g.birim)} ${gAd}`;
                return (
                  <div
                    key={gk}
                    className={`pmx-usat${secili ? " secili" : ""}${h.bos ? " bos" : ""}`}
                    onClick={() => !h.bos && onSec(gk, uk)}
                  >
                    <span className="ga">{g.ikon} {sol}</span>
                    <span className="ok">=</span>
                    <span className="sonuc">
                      <span className="deg mono">{h.deger}</span>
                      <span className="br">{h.bos ? "" : sagAd}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* MASAÜSTÜ (md ve üstü): matris tablosu */}
      <div className="pmx-card">
        <div className="pmx-scroll">
          <table>
            <thead>
              <tr>
                <th className="kose">
                  <span className="a">▼ ürün</span>&nbsp; <span className="b">▶ girdi</span>
                </th>
                {girdiKeys.map((gk) => {
                  const g = girdiler[gk];
                  return (
                    <th
                      key={gk}
                      className="girdi-bas"
                      style={hg === gk ? { background: "#10241A" } : undefined}
                    >
                      {g.ikon} {g.ad}
                      <span className="birim">{birimAd(g.birim)} başına</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {urunKeys.map((uk) => {
                const u = urunler[uk];
                const bayat = (gunFarki(u.tarih) ?? 0) >= BAYAT_ESIK_GUN;
                const satirVurgu = hu === uk;
                return (
                  <tr key={uk} className={satirVurgu ? "vurgu" : ""}>
                    <td className="cikti-bas">
                      {u.ikon} {u.ad}
                      {bayat && <span className="bayat" title="Veri 3+ gün eski">⚠</span>}
                      <span className="birim">1 {birimAd(u.birim)}</span>
                    </td>
                    {girdiKeys.map((gk) => {
                      const h = hucre(gk, uk);
                      const secili = gk === seciliGirdi && uk === seciliUrun;
                      const sutunVurgu = hg === gk;
                      return (
                        <td
                          key={gk}
                          className={`h${h.bos ? " bos" : ""}${secili ? " secili" : ""}`}
                          style={sutunVurgu && !secili ? { background: "#0E2014" } : undefined}
                          onClick={() => !h.bos && onSec(gk, uk)}
                          onMouseEnter={() => { setHg(gk); setHu(uk); }}
                          onMouseLeave={() => { setHg(undefined); setHu(undefined); }}
                        >
                          <span className="deg mono">{h.deger}</span>
                          <span className="br">{h.birim}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pmx-dip">
        <span className="vt" /> Tüm fiyatlar Anadolu Borsa'nın güncel verisinden gelir.
        Hücreye/satıra dokun → aşağıdaki grafik o pariteye geçer. <b>⚠</b> işareti veri 3+ gün eski demektir;
        boş hücre o ikili için güncel veri olmadığını belirtir. Matris yalnızca oranı gösterir, alım-satım tavsiyesi vermez.
      </div>
    </div>
  );
}

const CSS = `
.pmx{
  --zemin2:#0A1810; --kart:#0A140C; --kart2:#0E1E12; --murekkep:#DDF0DE;
  --yesil:#5FD08A; --yesil-koyu:#2E8B57; --yesil-soluk:#A8DCBC;
  --cizgi:#1A3020; --cizgi2:#244A30; --soluk:#7BA98C; --basak:#E8C040;
  position:relative; margin-bottom:24px; color:var(--murekkep);
  font-family:"Segoe UI",system-ui,sans-serif;
}
.pmx-head{margin-bottom:14px}
.pmx-eyebrow{
  font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--yesil); font-weight:700;
  display:flex; align-items:center; gap:8px;
}
.pmx-eyebrow::before{content:"";width:22px;height:2px;background:var(--yesil)}
.pmx-h{font-size:27px;font-weight:800;letter-spacing:-.01em;margin:8px 0 6px;color:var(--murekkep)}
.pmx-alt{font-size:15px;color:var(--soluk);max-width:540px;line-height:1.5}

.pmx-rehber{
  margin:14px 0;padding:13px 16px;
  background:linear-gradient(90deg,rgba(95,208,138,.12),rgba(95,208,138,.03));
  border:1px solid var(--cizgi2);border-left:3px solid var(--yesil);
  border-radius:0 6px 6px 0;font-size:14px;color:var(--yesil-soluk);line-height:1.55;
}
.pmx-rehber b{color:var(--murekkep)}

.pmx-secim{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 12px;align-items:center}
.pmx-secim .et{font-size:13px;color:var(--soluk);margin-right:2px}
.pmx-secim button{
  font-family:inherit;font-size:14px;font-weight:600;color:var(--yesil-soluk);
  background:var(--kart);border:1px solid var(--cizgi2);border-radius:20px;
  padding:8px 18px;cursor:pointer;transition:all .15s;
}
.pmx-secim button:hover{border-color:var(--yesil)}
.pmx-secim button.aktif{background:var(--yesil-koyu);color:#fff;border-color:var(--yesil-koyu);box-shadow:0 2px 10px rgba(46,139,87,.35)}

.pmx-card{
  background:
    linear-gradient(rgba(95,208,138,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(95,208,138,.04) 1px,transparent 1px),
    var(--kart);
  background-size:34px 34px,34px 34px,auto;
  border:1px solid var(--cizgi2);border-radius:10px;
  overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.4);
}
.pmx-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.pmx table{border-collapse:separate;border-spacing:0;width:100%;min-width:560px}
.pmx th,.pmx td{text-align:center;border-right:1px solid var(--cizgi);border-bottom:1px solid var(--cizgi)}
.pmx th:last-child,.pmx td:last-child{border-right:none}
.pmx tbody tr:last-child td{border-bottom:none}

.pmx .kose{
  background:var(--zemin2);padding:13px 14px;text-align:left;
  position:sticky;left:0;z-index:4;min-width:112px;line-height:1.5;
  font-size:12px;font-weight:600;border-right:2px solid var(--cizgi2);
}
.pmx .kose .a{color:var(--basak)}
.pmx .kose .b{color:var(--yesil-soluk)}

.pmx thead th.girdi-bas{
  background:var(--zemin2);color:var(--yesil);font-size:15px;font-weight:700;
  padding:13px 13px;white-space:nowrap;transition:background .12s;
}
.pmx thead th.girdi-bas .birim{
  display:block;font-size:12px;color:var(--soluk);font-weight:600;
  margin-top:4px;font-family:ui-monospace,monospace;letter-spacing:.03em;
}

.pmx td.cikti-bas{
  background:var(--zemin2);font-size:15px;font-weight:700;text-align:left;
  padding:13px 14px;position:sticky;left:0;z-index:2;white-space:nowrap;
  border-right:2px solid var(--cizgi2);color:var(--basak);transition:background .12s;
}
.pmx td.cikti-bas .birim{display:block;font-size:12px;color:var(--soluk);font-weight:500;font-family:ui-monospace,monospace;margin-top:3px}
.pmx td.cikti-bas .bayat{color:var(--basak);margin-left:5px}

.pmx td.h{padding:14px 11px;background:transparent;cursor:pointer;transition:background .12s}
.pmx td.h .deg{font-size:20px;font-weight:700;color:var(--murekkep);letter-spacing:-.01em}
.pmx td.h .br{font-size:12px;color:var(--soluk);display:block;margin-top:3px;font-family:ui-monospace,monospace}
.pmx td.h.bos{cursor:default}
.pmx td.h.bos .deg{color:var(--cizgi2);font-weight:400}
.pmx td.h.bos .br{color:transparent}
.pmx td.h.secili{background:rgba(232,192,64,.14);outline:1px solid rgba(232,192,64,.55);outline-offset:-1px}
.pmx tbody tr.vurgu td.cikti-bas{background:#10241A}

.pmx .mono{font-variant-numeric:tabular-nums}

.pmx-dip{
  margin-top:14px;font-size:13px;color:var(--soluk);line-height:1.7;
  padding:14px 16px;background:var(--kart);border:1px solid var(--cizgi2);border-radius:8px;
}
.pmx-dip b{color:var(--yesil-soluk)}
.pmx .vt{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4AE870;
  margin-right:6px;vertical-align:middle;box-shadow:0 0 6px rgba(74,232,112,.6)}

/* MOBİL KART GÖRÜNÜMÜ (GÜNCELLEME 1): md altında tablo gizli, kartlar açık */
.pmx-kartlar{display:none;flex-direction:column;gap:12px}
.pmx-ukart{
  background:var(--kart);border:1px solid var(--cizgi2);border-radius:10px;
  overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.3);
}
.pmx-ukart-bas{
  display:flex;align-items:baseline;gap:8px;
  background:var(--zemin2);padding:11px 14px;border-bottom:1px solid var(--cizgi);
}
.pmx-ukart-bas .ua{color:var(--basak);font-size:15px;font-weight:700}
.pmx-ukart-bas .bayat{color:var(--basak)}
.pmx-ukart-bas .ub{margin-left:auto;color:var(--soluk);font-size:12px;font-family:ui-monospace,monospace}
.pmx-usat{
  display:flex;align-items:baseline;gap:8px;padding:12px 14px;
  border-bottom:1px solid var(--cizgi);cursor:pointer;transition:background .12s;
}
.pmx-usat:last-child{border-bottom:none}
.pmx-usat .ga{color:var(--yesil);font-size:13.5px;font-weight:600;white-space:nowrap}
.pmx-usat .ok{color:var(--soluk);font-size:13px}
.pmx-usat .sonuc{margin-left:auto;display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;justify-content:flex-end}
.pmx-usat .deg{color:var(--murekkep);font-size:18px;font-weight:700}
.pmx-usat .br{color:var(--basak);font-size:12.5px;font-weight:600}
.pmx-usat.secili{background:rgba(224,169,59,.13);box-shadow:inset 3px 0 0 var(--basak)}
.pmx-usat.bos{cursor:default}
.pmx-usat.bos .deg{color:var(--cizgi2);font-weight:400}

@media(max-width:767px){
  .pmx-card{display:none}
  .pmx-kartlar{display:flex}
}
@media(max-width:480px){
  .pmx-h{font-size:23px}
  .pmx td.h .deg{font-size:17px}
  .pmx .kose{min-width:100px}
}
`;
