import "./globals.css";
import { Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export default function RootLayout({children,}: {children: React.ReactNode;}) {
  return (
    <html lang="en" className={instrumentSans.variable}>
      <body>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}