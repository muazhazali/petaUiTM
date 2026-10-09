import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Geist_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { PWARegister } from "./pwa";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetaUiTM — Interactive maps for UiTM campuses",
  description:
    "Open-source interactive maps for Universiti Teknologi MARA. Search campus buildings, get walking directions, and explore floor plans. Start with UiTM Shah Alam.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PetaUiTM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e5235",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${dmSerifDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
