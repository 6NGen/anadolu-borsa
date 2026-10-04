"use client";
// Aydınlık/karanlık tema düğmesi. Varsayılan: sistem ayarı (seçim yoksa).
// Seçim localStorage "tema"ya yazılır; layout'taki erken betik sayfa açılırken
// uygular (yanlış temanın bir anlık görünmesi önlenir).
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "light" | "dark";
const OLAY = "tema-degisti";

function etkinTema(): Tema {
  const secili = document.documentElement.getAttribute("data-theme");
  if (secili === "light" || secili === "dark") return secili;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function abone(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  window.addEventListener(OLAY, cb);
  mq.addEventListener("change", cb);
  return () => { window.removeEventListener(OLAY, cb); mq.removeEventListener("change", cb); };
}

export default function TemaDugmesi({ etiketli = false }: { etiketli?: boolean }) {
  // Sunucuda tema bilinmez → "dark" varsayılır; hidrasyondan sonra gerçeği okunur
  const tema = useSyncExternalStore(abone, etkinTema, () => "dark" as Tema);
  const sonraki: Tema = tema === "dark" ? "light" : "dark";

  const degistir = () => {
    document.documentElement.setAttribute("data-theme", sonraki);
    try { localStorage.setItem("tema", sonraki); } catch {}
    window.dispatchEvent(new Event(OLAY));
  };

  const etiket = sonraki === "light" ? "Aydınlık temaya geç" : "Karanlık temaya geç";
  return (
    <button
      onClick={degistir}
      className={etiketli ? "ab-btn" : "ab-btn ab-btn-ghost"}
      aria-label={etiket}
      title={etiket}
      style={etiketli ? { justifyContent: "center", height: "42px" } : { padding: "0 9px" }}
    >
      {tema === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      {etiketli && (sonraki === "light" ? "Aydınlık tema" : "Karanlık tema")}
    </button>
  );
}
