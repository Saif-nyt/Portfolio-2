import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/animations/ScrollProgress";
import { AchievementToast } from "@/components/game/AchievementToast";
import { CursorWisp } from "@/components/game/CursorWisp";
import { SparkBurst } from "@/components/game/SparkBurst";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppWidget } from "@/components/layout/WhatsAppWidget";
import { SITE, SITE_URL } from "@/lib/site";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const editorial = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.role}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "full-stack web developer",
    "WordPress developer",
    "Shopify developer",
    "Next.js developer",
    "Meta Ads",
    "Facebook Conversion API",
    "conversion tracking",
    "GA4",
    "e-commerce development",
    "digital growth specialist",
  ],
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.role}`,
    description: SITE.description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.role}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07110F" },
    { media: "(prefers-color-scheme: light)", color: "#F4F3EC" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `(function(){try{var s=window.localStorage.getItem("theme");var t=(s==="dark"||s==="light")?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  jobTitle: SITE.role,
  email: `mailto:${SITE.email}`,
  telephone: SITE.phone,
  url: SITE_URL,
  description: SITE.description,
  knowsAbout: [
    "Web development",
    "Next.js",
    "React",
    "WordPress",
    "Shopify",
    "Meta Ads",
    "Facebook Conversion API",
    "Server-side tracking",
    "GA4",
    "Conversion tracking",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${editorial.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ScrollProgress />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppWidget />
        <SparkBurst />
        <CursorWisp />
        <AchievementToast />
      </body>
    </html>
  );
}
