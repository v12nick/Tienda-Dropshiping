import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export default function HomePage() {
  return (
    <div>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 px-6 py-14 text-white sm:px-12">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Free shipping over $75
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            Gadgets people actually want, shipped worldwide.
          </h1>
          <p className="mt-4 text-lg text-brand-100">
            Hand-picked tech and lifestyle products at prices that make sense.
            Discover something new today.
          </p>
          <a
            href="#catalog"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Shop the collection
          </a>
        </div>
      </section>

      <section id="catalog" className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Trending this week
          </h2>
          <span className="text-sm text-slate-500">
            {products.length} products
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
