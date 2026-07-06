import type { Metadata } from "next";
import { Urbanist, Cormorant } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-inter", /* Keeping variable name same to not break CSS */
});

const cormorant = Cormorant({
  subsets: ["latin"],
  variable: "--font-playfair", /* Keeping variable name same to not break CSS */
});

export const metadata: Metadata = {
  title: "GurmeIST | Eşsiz Lezzetler",
  description: "GurmeIST restoranının özel menüsü, kalori değerleri ve iletişim bilgileri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${urbanist.variable} ${cormorant.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
