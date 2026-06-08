import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { RecordingIndicator } from "@/components/hikes/recording-indicator";
import { ApiOriginSetup } from "@/components/api-origin-setup";
import { PwaRegister } from "@/components/pwa-register";
import { SplashHider } from "@/components/splash-hider";
import { NativeBackButton } from "@/components/native-back-button";
import { NativeEdgeToEdge } from "@/components/native-edge-to-edge";
import { OfflinePrecache } from "@/components/offline-precache";
import { OfflineTilePrefetch } from "@/components/offline-tile-prefetch";
import { SiteFooter } from "@/components/site-footer";
import { getAllTrails } from "@/lib/trails";
import { appRoutes } from "@/lib/offline/routes";
import { SkipLink } from "@/components/skip-link";
import { SITE_URL } from "@/lib/site";
import { shouldUseDarkTheme } from "@/lib/theme";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Apply the saved theme before paint to avoid a flash of the wrong mode. The
// decision is the tested `shouldUseDarkTheme` (serialised here), so the site
// defaults to light and only goes dark on an explicit opt-in.
const themeScript = `try{if((${shouldUseDarkTheme.toString()})(localStorage.getItem('theme')))document.documentElement.classList.add('dark')}catch(e){}`;

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
  // The app defaults to light regardless of the OS setting, so the browser
  // chrome takes the brand forest rather than tracking `prefers-color-scheme`.
  themeColor: "#2a3623",
  // Render edge-to-edge so the native shell (Capacitor) can use the full screen;
  // `env(safe-area-inset-*)` then keeps content clear of the status bar, Dynamic
  // Island, and home indicator (see the header and globals.css).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const trails = getAllTrails();
  const precacheRoutes = appRoutes(trails.map((trail) => trail.slug));
  const trailheads = trails.map((trail) => trail.coordinates);
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-cream text-ink flex min-h-full flex-col antialiased">
        <SkipLink />
        <ApiOriginSetup />
        <SplashHider />
        <NativeBackButton />
        <NativeEdgeToEdge />
        <PwaRegister />
        <OfflinePrecache routes={precacheRoutes} />
        <OfflineTilePrefetch trailheads={trailheads} />
        <SiteHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          {children}
        </main>
        <SiteFooter />
        <RecordingIndicator />
        <MobileTabBar />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
