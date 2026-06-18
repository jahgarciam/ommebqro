import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const adsenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
const shouldLoadAdsense = adsEnabled && Boolean(adsenseClientId);

export const metadata: Metadata = {
  title: "OMMEB Querétaro | IQmat",
  description:
    "Plataforma de estudio autogestivo para la Olimpiada Mexicana de Matemáticas para Educación Básica en Querétaro.",
  other: adsenseClientId
    ? {
        "google-adsense-account": adsenseClientId,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {shouldLoadAdsense ? (
        <Script
          id="google-adsense"
          strategy="beforeInteractive"
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
        />
      ) : null}

      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}