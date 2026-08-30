# Tienda-Dropshiping

TiendaDrop is a modern dropshipping storefront built with **Next.js (App Router)**,
**React**, **TypeScript**, and **Tailwind CSS**. It demonstrates a complete shopping
flow: browse a product catalog, view product details, manage a cart, and place an
order through a JSON API with an order-confirmation page.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19
- TypeScript
- Tailwind CSS 3
- API routes for products and orders (in-memory order store)

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install     # install dependencies
npm run dev     # start the dev server on http://localhost:3000
```

Then open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the development server (port 3000)     |
| `npm run build` | Create a production build                    |
| `npm run start` | Serve the production build (port 3000)       |
| `npm run lint`  | Run ESLint (`next lint`)                      |

## Project structure

```
src/
  app/
    page.tsx              # Storefront / catalog
    product/[id]/page.tsx # Product detail
    cart/page.tsx         # Shopping cart
    checkout/page.tsx     # Checkout form
    order/[id]/page.tsx   # Order confirmation
    api/products/route.ts # GET products
    api/orders/route.ts   # POST create order / GET order by id
  components/             # Cart context, header, product UI
  lib/                    # Product data, order store, helpers
```

## API

- `GET /api/products` — list all products.
- `POST /api/orders` — create an order from `{ customer, items }`.
- `GET /api/orders?id=<orderId>` — fetch a placed order.

## Cloud Agent environment

This repository includes a `.cursor/environment.json` so Cursor Cloud Agents
install dependencies with `npm install` and run the dev server automatically.
