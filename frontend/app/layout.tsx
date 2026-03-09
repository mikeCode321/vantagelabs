import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vantage Personal",
  description: "Plan and simulate your personal finances with Vantage Personal. Custom investment, savings, and retirement simulations.",
  keywords: [
    "personal finance",
    "financial simulator",
    "savings planner",
    "investment simulator",
    "retirement planning",
    "Vantage Personal"
  ],
  authors: [{ name: "Vantage Labs", url: "https://vantage.com" }],

  // commented out for now - but useful for seo and social sharing when we have a public site
  // openGraph: {
  //   title: "Vantage Personal",
  //   description: "Custom personal finance simulations to plan your investments, savings, and retirement.",
  //   url: "https://personal.vantage.com",
  //   siteName: "Vantage Personal",
  //   type: "website",
  //   images: [
  //     {
  //       url: "https://personal.vantage.com/og-image.png",
  //       width: 1200,
  //       height: 630,
  //       alt: "Vantage Personal - Financial Simulation Dashboard",
  //     },
  //   ],
  // },
  
  // EXAMPLE: for social media card when sharing 
  // twitter: {
  //   card: "summary_large_image",
  //   title: "Vantage Personal",
  //   description: "Custom personal finance simulations to plan your investments, savings, and retirement.",
  //   images: ["https://personal.vantage.com/og-image.png"],
  //   creator: "@VantageLabs",
  // },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-zinc-50 dark:bg-black font-sans">
        <header className="p-4 shadow-md bg-white dark:bg-zinc-900">
          My Navbar
        </header>

        <main className="min-h-screen p-6">{children}</main>

        <footer className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} Vantage Labs. All rights reserved.
        </footer>
      </body>
    </html>
  );
}