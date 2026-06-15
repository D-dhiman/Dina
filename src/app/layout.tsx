import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
  Uncial_Antiqua,
  Space_Grotesk,
  Lato,
  Roboto_Slab,
  Inter,
  Merriweather,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const uncialAntiqua = Uncial_Antiqua({
  variable: "--font-uncial-antiqua",
  subsets: ["latin"],
  weight: ["400"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "100"],
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  weight: ["400", "700","900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300","400", "700","800","900"],
});

export const metadata: Metadata = {
  title: "DINA-AI",
  description: "Digital Intelligent Natural Ayurvedic Assistant",
  icons: {
    icon: "/konak-wheel.svg",
  },
};

export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${uncialAntiqua.variable} ${spaceGrotesk.variable} ${lato.variable} ${robotoSlab.variable} ${inter.variable} ${merriweather.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
