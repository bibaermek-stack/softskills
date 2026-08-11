import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/content";

// The site is in Kazakh, so both faces must carry cyrillic-ext — that subset
// holds ә ғ қ ң ө ұ ү һ. (Sora, used previously, has no Cyrillic at all.)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display-face",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — STEM білім беру және креативті тәрбие`,
    template: `%s — ${site.shortName}`,
  },
  description: site.tagline,
  keywords: [
    "STEM білім беру",
    "креативті тәрбие",
    "виртуалды оқыту платформасы",
    "икемді дағдылар",
    "soft skills",
    "пәнаралық оқыту",
    "бейімделген оқыту",
    "цифрлық білім беру",
    "Қазақстан",
    site.grantNumber,
  ],
  authors: [{ name: site.funderKk }],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — STEM білім беру және креативті тәрбие`,
    description: site.tagline,
    url: site.url,
    locale: "kk_KZ",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.tagline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#060b1a",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ResearchProject",
  inLanguage: "kk",
  name: site.name,
  alternateName: site.grantTitleKk,
  description: site.tagline,
  url: site.url,
  identifier: site.grantNumber,
  funder: { "@type": "GovernmentOrganization", name: site.funderKk },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk" className={`${inter.variable} ${manrope.variable} antialiased`}>
      <body className="bg-paper text-ink-900">
        <script
          type="application/ld+json"
          // Static, author-controlled metadata — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
