import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import PwaRegistrar from "../components/PwaRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gamja Office",

  description:
    "감자들과 함께하는 온라인 오피스 게임",

  manifest:
    "/manifest.webmanifest",

  applicationName:
    "Gamja Office",

  appleWebApp: {
    capable: true,
    title: "Gamja Office",
    statusBarStyle:
      "black-translucent",
  },

  formatDetection: {
    telephone: false,
  },

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",

  initialScale: 1,
  maximumScale: 1,
  userScalable: false,

  viewportFit: "cover",

  themeColor: "#090909",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        h-full
        antialiased
      `}
      suppressHydrationWarning
    >
      <body
        className="
          min-h-full
          flex
          flex-col
          bg-black
          overscroll-none
        "
      >
        {children}

        <PwaRegistrar />
      </body>
    </html>
  );
}