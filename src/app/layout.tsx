import type { Metadata } from "next";
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

const adsenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  title: "OMMEB_Qro",
  description:
    "Plataforma de estudio autogestivo para la Olimpiada Mexicana de Matemáticas para Educación Básica en Querétaro.",
  icons: {
    icon: [
      {
        url: "/logos/IQmat.jpg",
        type: "image/jpeg",
      },
    ],
    shortcut: "/logos/IQmat.jpg",
    apple: [
      {
        url: "/logos/IQmat.jpg",
        type: "image/jpeg",
      },
    ],
  },
  other: adsenseClientId
    ? { "google-adsense-account": adsenseClientId }
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}