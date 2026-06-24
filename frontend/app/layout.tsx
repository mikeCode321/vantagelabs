import "./globals.css";
import { Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Firephin — Personal Finance Simulator",
  description: "Firephin is a free FIRE calculator and retirement simulator. Project your net worth, model income, expenses, and investments over your lifetime.",  metadataBase: new URL("https://firephin.com"),
  openGraph: {
    title: "Firephin — Personal Finance Simulator",
    description: "Simulate your financial future.",
    url: "https://firephin.com",
    siteName: "Firephin",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Firephin — Personal Finance Simulator",
    description: "Simulate your financial future.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={instrumentSans.variable}>
      <body>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}