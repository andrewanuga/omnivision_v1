import type { Metadata } from "next";
import { Anton, Manrope } from "next/font/google";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Omnivision",
  description: "Omnivision: a resilient, decentralized autonomy stack for drone fleets (simulation prototype).",
  icons: {
    icon: [
      { url: "/omini-logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/omini-logo.png",
    apple: "/omini-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans bg-ink">{children}</body>
    </html>
  );
}
