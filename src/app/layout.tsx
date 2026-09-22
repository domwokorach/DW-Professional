import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { defaultLocale, locales, isRtlLocale } from "@/i18n/config";

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

// Runs synchronously before first paint to correct `lang`/`dir` for the
// visitor's actual locale (read from the URL prefix the browser shows,
// e.g. /es/..., which middleware keeps even though it rewrites the
// internal route). This keeps the root layout static (no headers()/cookies()
// dependency, so every marketing page can be prerendered) while still
// avoiding an LTR->RTL flash for Arabic visitors on first paint.
const localeBootstrapScript = `(function(){try{var seg=(location.pathname.split("/")[1]||"").toLowerCase();if(${JSON.stringify(locales.map((l) => l.toLowerCase()))}.indexOf(seg)!==-1){document.documentElement.lang=seg;document.documentElement.dir=seg==="ar"?"rtl":"ltr";}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={defaultLocale}
      dir={isRtlLocale(defaultLocale) ? "rtl" : "ltr"}
      className={`${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootstrapScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          storageKey="theme-preference-v1"
        >
          <TooltipProvider delayDuration={200}>
            <LocaleProvider initialLocale={defaultLocale}>{children}</LocaleProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
