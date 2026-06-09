import './globals.css'
import { Inter, DM_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable} ${playfair.variable}`}>
      <body>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  )
}