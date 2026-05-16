import type { Metadata } from "next";
import { Archivo_Black, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const sans = Instrument_Sans({
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StakeWord — stake on shipping",
  description:
    "Self-contract ERC-8183 protocol. Turn a hackathon goal into a funded job; Claude evaluates on-chain; failed stakes reward the people who actually finish.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
