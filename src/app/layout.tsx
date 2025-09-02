import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/animations/MotionProvider";
// Removed theme provider - using light mode only

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "World Staffing Awards 2026",
  description: "Celebrating excellence in the global staffing industry. Vote for outstanding individuals and companies making a difference in talent acquisition and workforce solutions.",
  keywords: "staffing awards, recruitment excellence, talent acquisition, workforce solutions, HR awards",
  authors: [{ name: "World Staffing Awards" }],
  openGraph: {
    title: "World Staffing Awards 2026",
    description: "Celebrating excellence in the global staffing industry",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Staffing Awards 2026",
    description: "Celebrating excellence in the global staffing industry",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        <MotionProvider>
          <Navigation />
          <main className="min-h-screen bg-white">
            {children}
          </main>
          <Footer />
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
