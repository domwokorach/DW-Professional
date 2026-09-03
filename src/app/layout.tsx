import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsentManager from "@/components/ui/CookieConsentManager";
import BackToTopButton from "@/components/ui/BackToTopButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = "https://www.dominicwokorach.me/";
const title = "Dominic | Software Engineer & Frontend Developer";
const description =
  "Software Engineer and Frontend Developer based in London, specialising in React, TypeScript, Next.js, accessible web applications, UX/UI and modern frontend engineering.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Dominic Wokorach",
    images: [{ url: "/images/dominic/portrait.jpg", width: 1200, height: 630 }],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/dominic/portrait.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CookieConsentManager />
        <BackToTopButton />
      </body>
    </html>
  );
}
