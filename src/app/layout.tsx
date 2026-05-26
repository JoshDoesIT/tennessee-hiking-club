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
  },
  twitter: {
    card: "summary_large_image",
    title: "Tennessee Hiking Club",
    description:
      "Discover the Volunteer State's best trails on an interactive map.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2a3623",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${fraunces.variable} h-full`}
    >
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
