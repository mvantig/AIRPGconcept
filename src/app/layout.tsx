import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Literata } from "next/font/google";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["SOFT", "opsz"] });
const serif = Literata({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"] });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: "Realmweaver",
  description: "An illustrated, AI-narrated RPG where every world, hero and story is woven for you.",
};

export const viewport: Viewport = {
  themeColor: "#0e0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
