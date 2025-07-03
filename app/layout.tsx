import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Knugget AI - AI-Powered Content Summaries",
  description:
    "Generate intelligent summaries and key insights from YouTube, LinkedIn, and web content using AI.",
  keywords: [
    "YouTube summaries",
    "LinkedIn posts",
    "AI content analysis",
    "content summarization",
    "artificial intelligence",
    "productivity tools",
  ],
  authors: [{ name: "Knugget AI" }],
  creator: "Knugget AI",
  publisher: "Knugget AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
      "https://knugget-new-client.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Knugget AI - AI-Powered Content Summaries",
    description:
      "Generate intelligent summaries and key insights from YouTube, LinkedIn, and web content using AI.",
    url: "/",
    siteName: "Knugget AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Knugget AI - AI-Powered Content Summaries",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knugget AI - AI-Powered Content Summaries",
    description:
      "Generate intelligent summaries and key insights from YouTube, LinkedIn, and web content using AI.",
    images: ["/og-image.png"],
    creator: "@knuggetai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* <link rel="manifest" href="/manifest.json" /> */}

        {/* Theme Color */}
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS Prefetch */}
        <link
          rel="dns-prefetch"
          href="https://knugget-new-backend.onrender.com"
        />

        {/* Chrome Extension Connection */}
        {process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID && (
          <meta
            name="chrome-extension-id"
            content={process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID}
          />
        )}
      </head>
      <body
        className={`${inter.className} dark bg-gray-950 text-white`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col bg-gray-950">
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>

        {/* Development helpers */}
        {process.env.NODE_ENV === "development" && <DevTools />}
      </body>
    </html>
  );
}

// Development tools (only shown in development)
function DevTools() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono">
      DEV: {process.env.NODE_ENV}
    </div>
  );
}
