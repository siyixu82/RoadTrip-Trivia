import type { Metadata, Viewport } from "next";
import { Geist, Space_Mono } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monospace face for the small uppercase labels/tags in the sketch design.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoadTrip Trivia",
  description: "Place-based trivia for travelers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "RoadTrip Trivia",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5A623",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
