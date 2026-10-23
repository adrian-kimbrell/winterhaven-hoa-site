import type { Metadata } from "next";
import { Cormorant, Jost } from "next/font/google";
import { getSettings } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Winterhaven Village · Tucson, Arizona",
    template: "%s · Winterhaven Village",
  },
  description:
    "Winterhaven Village Homeowners Association — desert living, neighborly spirit. Community news, resident directory, board updates, and CC&R answers.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSettings();
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        {site.bannerText && <div className="alpha-bar">{site.bannerText}</div>}
        {children}
      </body>
    </html>
  );
}
