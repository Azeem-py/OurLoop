import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-humanist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OurLoop — A Private World for Two",
  description: "OurLoop — A private, just-the-two-of-you space for love, memories, diary and chat across distances.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OurLoop",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0D13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plusJakartaSans.variable}`}>
      <body
        suppressHydrationWarning
        className="bg-[#0E0D13] text-[#F6F3EE] antialiased selection:bg-[#E26D54] selection:text-white min-h-screen"
      >
        {children}
      </body>
    </html>
  );
}
