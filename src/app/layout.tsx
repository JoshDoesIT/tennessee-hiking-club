import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { SITE_URL } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tennessee Hiking Club",
    template: "%s · Tennessee Hiking Club",
  },
  description:
    "Discover the Volunteer State's best trails on an interactive map: photos, coordinates, and one-tap directions to the trailhead. A community hiking club for Tennessee.",
  keywords: [
    "Tennessee hiking",
    "Tennessee trails",
    "hiking club",
    "Great Smoky Mountains",
    "Cumberland Plateau",
    "trail map",
  ],
  authors: [{ name: "Tennessee Hiking Club" }],
  openGraph: {
    type: "website",
    siteName: "Tennessee Hiking Club",
    title: "Tennessee Hiking Club",
    description:
      "Discover the Volunteer State's best trails on an interactive map: photos, coordinates, and one-tap directions.",
    url: "/",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Tennessee Hiking Club: a vintage badge above the layered ridges of the Smoky Mountains",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tennessee Hiking Club",
    description:
      "Discover the Volunteer State's best trails on an interactive map.",
    images: [
      {
        url: "/twitter-image.png",
        width: 1200,
        height: 630,
        alt: "Tennessee Hiking Club: a vintage badge above the layered ridges of the Smoky Mountains",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2a3623" },
    { media: "(prefers-color-scheme: dark)", color: "#161a12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Set the theme before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}",
          }}
        />
      </head>
      <body className="bg-cream text-ink flex min-h-full flex-col antialiased">
        <SkipLink />
        <SiteHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          {children}
        </main>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
