"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${product.id}`} className="block">
        <div
          className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${product.gradient}`}
        >
          <span className="text-6xl drop-shadow-lg transition group-hover:scale-110">
            {product.emoji}
          </span>
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {product.category}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-slate-900 hover:text-brand-600">
              {product.name}
            </h3>
          </Link>
          <span className="whitespace-nowrap text-sm font-medium text-amber-500">
            ★ {product.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{product.tagline}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-95"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
