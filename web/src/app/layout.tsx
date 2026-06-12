import type { Metadata } from "next";
import { IBM_Plex_Mono, Syne } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://borsanadolu.6ngen.com"),
  title: "Anadolu Borsa — Türkiye Tarım ve Hayvancılık Fiyatları",
  description: "Güncel tarım ürünleri ve hayvancılık fiyatları. TOBB, KTB, ESK verileri. Günlük güncellenir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${mono.variable} ${syne.variable}`}>
      <body style={{ background: "#080E09", minHeight: "100vh" }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
