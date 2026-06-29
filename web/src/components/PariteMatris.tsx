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
  const [yon, setYon] = useState<Yon>("ug");
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
                      style={hg === gk ? { background: "#16335c" } : undefined}
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
                          style={sutunVurgu && !secili ? { background: "#162a47" } : undefined}
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
        Hücreye dokun → aşağıdaki grafik o pariteye geçer. <b>⚠</b> işareti veri 3+ gün eski demektir;
        boş hücre o ikili için güncel veri olmadığını belirtir. Matris yalnızca oranı gösterir, alım-satım tavsiyesi vermez.
      </div>
    </div>
  );
}

const CSS = `
.pmx{
  --zemin2:#0f1d31; --kart:#13243c; --kart2:#162a47; --murekkep:#eaf1fb;
  --mavi:#4d8dff; --mavi-koyu:#2f6df0; --mavi-soluk:#9bbcf5;
  --cizgi:#22395a; --cizgi2:#2c456a; --soluk:#6f87a8; --basak:#e0a93b;
  position:relative; margin-bottom:24px; color:var(--murekkep);
  font-family:"Segoe UI",system-ui,sans-serif;
}
.pmx-head{margin-bottom:14px}
.pmx-eyebrow{
  font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--mavi); font-weight:700;
  display:flex; align-items:center; gap:8px;
}
.pmx-eyebrow::before{content:"";width:22px;height:2px;background:var(--mavi)}
.pmx-h{font-size:26px;font-weight:800;letter-spacing:-.01em;margin:7px 0 5px;color:var(--murekkep)}
.pmx-alt{font-size:14px;color:var(--soluk);max-width:520px}

.pmx-rehber{
  margin:14px 0;padding:12px 15px;
  background:linear-gradient(90deg,rgba(77,141,255,.12),rgba(77,141,255,.03));
  border:1px solid var(--cizgi2);border-left:3px solid var(--mavi);
  border-radius:0 6px 6px 0;font-size:13px;color:var(--mavi-soluk);
}
.pmx-rehber b{color:var(--murekkep)}

.pmx-secim{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 12px;align-items:center}
.pmx-secim .et{font-size:12px;color:var(--soluk);margin-right:2px}
.pmx-secim button{
  font-family:inherit;font-size:13px;font-weight:600;color:var(--mavi-soluk);
  background:var(--kart);border:1px solid var(--cizgi2);border-radius:20px;
  padding:7px 16px;cursor:pointer;transition:all .15s;
}
.pmx-secim button:hover{border-color:var(--mavi)}
.pmx-secim button.aktif{background:var(--mavi-koyu);color:#fff;border-color:var(--mavi-koyu);box-shadow:0 2px 10px rgba(47,109,240,.35)}

.pmx-card{
  background:
    linear-gradient(rgba(77,141,255,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(77,141,255,.045) 1px,transparent 1px),
    var(--kart);
  background-size:34px 34px,34px 34px,auto;
  border:1px solid var(--cizgi2);border-radius:8px;
  overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.35);
}
.pmx-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.pmx table{border-collapse:separate;border-spacing:0;width:100%;min-width:560px}
.pmx th,.pmx td{text-align:center;border-right:1px solid var(--cizgi);border-bottom:1px solid var(--cizgi)}
.pmx th:last-child,.pmx td:last-child{border-right:none}
.pmx tbody tr:last-child td{border-bottom:none}

.pmx .kose{
  background:var(--zemin2);padding:12px 13px;text-align:left;
  position:sticky;left:0;z-index:4;min-width:104px;line-height:1.45;
  font-size:11px;font-weight:600;border-right:2px solid var(--cizgi2);
}
.pmx .kose .a{color:var(--basak)}
.pmx .kose .b{color:var(--mavi-soluk)}

.pmx thead th.girdi-bas{
  background:var(--zemin2);color:var(--murekkep);font-size:13px;font-weight:700;
  padding:12px 11px;white-space:nowrap;transition:background .12s;
}
.pmx thead th.girdi-bas .birim{
  display:block;font-size:10px;color:var(--mavi);font-weight:600;
  margin-top:3px;font-family:ui-monospace,monospace;letter-spacing:.04em;
}

.pmx td.cikti-bas{
  background:var(--zemin2);font-size:13px;font-weight:700;text-align:left;
  padding:12px 13px;position:sticky;left:0;z-index:2;white-space:nowrap;
  border-right:2px solid var(--cizgi2);color:var(--basak);transition:background .12s;
}
.pmx td.cikti-bas .birim{display:block;font-size:10px;color:var(--soluk);font-weight:500;font-family:ui-monospace,monospace}
.pmx td.cikti-bas .bayat{color:#e0a93b;margin-left:5px}

.pmx td.h{padding:13px 9px;background:transparent;cursor:pointer;transition:background .12s}
.pmx td.h .deg{font-size:17px;font-weight:700;color:var(--murekkep);letter-spacing:-.01em}
.pmx td.h .br{font-size:10px;color:var(--soluk);display:block;margin-top:2px;font-family:ui-monospace,monospace}
.pmx td.h.bos{cursor:default}
.pmx td.h.bos .deg{color:var(--cizgi2);font-weight:400}
.pmx td.h.bos .br{color:transparent}
.pmx td.h.secili{background:rgba(224,169,59,.14);outline:1px solid rgba(224,169,59,.55);outline-offset:-1px}
.pmx tbody tr.vurgu td.cikti-bas{background:#1a3052}

.pmx .mono{font-variant-numeric:tabular-nums}

.pmx-dip{
  margin-top:14px;font-size:12px;color:var(--soluk);line-height:1.65;
  padding:13px 15px;background:var(--kart);border:1px solid var(--cizgi2);border-radius:7px;
}
.pmx-dip b{color:var(--mavi-soluk)}
.pmx .vt{display:inline-block;width:7px;height:7px;border-radius:50%;background:#41c777;
  margin-right:5px;vertical-align:middle;box-shadow:0 0 6px rgba(65,199,119,.6)}

@media(max-width:480px){
  .pmx-h{font-size:22px}
  .pmx td.h .deg{font-size:15px}
  .pmx .kose{min-width:92px}
}
`;
