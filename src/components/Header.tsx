"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg text-white shadow-sm">
            🛍️
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Tienda<span className="text-brand-600">Drop</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-brand-600 sm:block"
          >
            Shop
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Cart
            <span
              data-testid="cart-count"
              className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-bold text-slate-900"
            >
              {itemCount}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
