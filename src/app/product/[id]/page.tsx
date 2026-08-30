import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        ← Back to shop
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div
          className={`flex h-80 items-center justify-center rounded-3xl bg-gradient-to-br ${product.gradient} lg:h-[28rem]`}
        >
          <span className="text-[10rem] drop-shadow-2xl">{product.emoji}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {product.category}
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-amber-500">
            <span>★ {product.rating.toFixed(1)}</span>
            <span className="text-slate-400">· In stock</span>
          </div>

          <p className="mt-4 text-slate-600">{product.description}</p>

          <div className="mt-6 text-4xl font-extrabold text-slate-900">
            {formatPrice(product.price)}
          </div>

          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>

          <ul className="mt-8 space-y-2 text-sm text-slate-600">
            <li>✓ Free returns within 30 days</li>
            <li>✓ Ships in 2–5 business days</li>
            <li>✓ Secure checkout</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
