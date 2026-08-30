"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "./CartProvider";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        emoji: product.emoji,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="inline-flex items-center rounded-full border border-slate-300">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="grid h-11 w-11 place-items-center rounded-l-full text-lg text-slate-600 hover:bg-slate-100"
        >
          −
        </button>
        <span
          data-testid="qty"
          className="w-10 text-center font-semibold text-slate-900"
        >
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQuantity((q) => q + 1)}
          className="grid h-11 w-11 place-items-center rounded-r-full text-lg text-slate-600 hover:bg-slate-100"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex-1 rounded-full bg-brand-600 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98]"
      >
        {added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
