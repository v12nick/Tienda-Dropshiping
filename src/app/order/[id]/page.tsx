"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Order } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

type Status = "loading" | "found" | "missing";

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    fetch(`/api/orders?id=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!active) return;
        setOrder(data.order);
        setStatus("found");
      })
      .catch(() => {
        if (!active) return;
        setStatus("missing");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="py-16 text-center text-slate-500">Loading order…</div>
    );
  }

  if (status === "missing" || !order) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Order not found
        </h1>
        <p className="mt-2 text-slate-500">
          We couldn&apos;t find order <span className="font-mono">{id}</span>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-3xl text-white">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
          Thank you, {order.customer.name.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-slate-600">
          Your order is confirmed. A receipt was sent to{" "}
          <span className="font-medium">{order.customer.email}</span>.
        </p>
        <p
          className="mt-4 inline-block rounded-full bg-white px-4 py-2 font-mono text-sm font-semibold text-slate-900"
          data-testid="order-id"
        >
          Order {order.id}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Order details</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="text-slate-700">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Shipping</dt>
            <dd className="font-medium">
              {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <dt className="font-semibold text-slate-900">Total paid</dt>
            <dd className="font-bold text-slate-900" data-testid="order-total">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Shipping to</p>
          <p className="mt-1">{order.customer.name}</p>
          <p className="whitespace-pre-line">{order.customer.address}</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
