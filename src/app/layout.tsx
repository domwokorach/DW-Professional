import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "@/components/ui/loading-screen";
import "./globals.css";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { defaultLocale, isRtlLocale, normaliseLocale } from "@/i18n/config";

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
  alternates: {
    canonical: `${siteUrl}en-gb`,
    languages: {
      "en-GB": "/en-gb",
      "en-US": "/en-us",
      es: "/es",
      fr: "/fr",
      de: "/de",
      it: "/it",
      pt: "/pt",
      nl: "/nl",
      pl: "/pl",
      th: "/th",
      ja: "/ja",
      ko: "/ko",
      zh: "/zh",
      ar: "/ar",
      hi: "/hi",
      "x-default": "/en-gb",
    },
  },
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = normaliseLocale(requestHeaders.get("x-portfolio-locale")) ?? defaultLocale;

  return (
    <html
      lang={locale}
      dir={isRtlLocale(locale) ? "rtl" : "ltr"}
      className={`${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          storageKey="theme-preference-v1"
        >
          <TooltipProvider delayDuration={200}>
            <LocaleProvider initialLocale={locale}>
              <LoadingScreen>{children}</LoadingScreen>
            </LocaleProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
