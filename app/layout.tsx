import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

// iOS only reads splash screens from these <link rel="apple-touch-startup-image">
// tags (it ignores manifest.json entirely), keyed by exact device viewport,
// pixel ratio, and orientation. Without them Safari shows a black screen
// while the PWA boots from the home screen. Generated via
// scripts/generate-splash-screens.js into public/splash.
const APPLE_SPLASH_SCREENS = [
  { width: 640, height: 1136, dpr: 2, deviceWidth: 320, deviceHeight: 568 },
  { width: 750, height: 1334, dpr: 2, deviceWidth: 375, deviceHeight: 667 },
  { width: 1125, height: 2436, dpr: 3, deviceWidth: 375, deviceHeight: 812 },
  { width: 828, height: 1792, dpr: 2, deviceWidth: 414, deviceHeight: 896 },
  { width: 1242, height: 2688, dpr: 3, deviceWidth: 414, deviceHeight: 896 },
  { width: 1242, height: 2208, dpr: 3, deviceWidth: 414, deviceHeight: 736 },
  { width: 1536, height: 2048, dpr: 2, deviceWidth: 768, deviceHeight: 1024 },
  { width: 1668, height: 2224, dpr: 2, deviceWidth: 834, deviceHeight: 1112 },
  { width: 1668, height: 2388, dpr: 2, deviceWidth: 834, deviceHeight: 1194 },
  { width: 2048, height: 2732, dpr: 2, deviceWidth: 1024, deviceHeight: 1366 },
] as const;

const appleStartupImages = APPLE_SPLASH_SCREENS.flatMap(
  ({ width, height, dpr, deviceWidth, deviceHeight }) => [
    {
      url: `/splash/apple-splash-${width}x${height}.png`,
      media: `screen and (device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    },
    {
      url: `/splash/apple-splash-${height}x${width}.png`,
      media: `screen and (device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: landscape)`,
    },
  ]
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Stock — Marketplace for SMEs",
  description:
    "Shop local SME products and manage inventory with Smart Stock.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Stock IMS",
    startupImage: appleStartupImages,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        {children}
        <CartDrawer />
        <Toaster richColors position="top-center" />
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
