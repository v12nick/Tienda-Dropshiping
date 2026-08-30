import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "TiendaDrop — Curated gadgets, shipped to your door",
  description:
    "A modern dropshipping storefront demo built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} TiendaDrop · Demo storefront ·
              Fast, worldwide shipping
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
