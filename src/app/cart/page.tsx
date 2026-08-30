"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

const FREE_SHIPPING_THRESHOLD = 75;

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-slate-500">
          Browse the collection and add something you love.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 4.99;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-3xl">
                {line.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{line.name}</p>
                <p className="text-sm text-slate-500">
                  {formatPrice(line.price)} each
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-slate-300">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => updateQuantity(line.id, line.quantity - 1)}
                  className="grid h-9 w-9 place-items-center rounded-l-full text-slate-600 hover:bg-slate-100"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => updateQuantity(line.id, line.quantity + 1)}
                  className="grid h-9 w-9 place-items-center rounded-r-full text-slate-600 hover:bg-slate-100"
                >
                  +
                </button>
              </div>

              <div className="w-24 text-right font-semibold text-slate-900">
                {formatPrice(line.price * line.quantity)}
              </div>

              <button
                type="button"
                aria-label={`Remove ${line.name}`}
                onClick={() => removeItem(line.id)}
                className="text-slate-400 transition hover:text-rose-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium" data-testid="cart-subtotal">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className="font-medium">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="font-bold text-slate-900">
                {formatPrice(subtotal + shipping)}
              </dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-brand-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-700"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/"
            className="mt-3 block text-center text-sm text-slate-500 hover:text-brand-600"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
