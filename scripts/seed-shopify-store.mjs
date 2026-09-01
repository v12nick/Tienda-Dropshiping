#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { shopifyExecute } from "./shopify-exec.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(readFileSync(join(root, "catalog/products.json"), "utf8"));
const LOOKUP = `query StoreContext {
  locations(first: 10) {
    nodes { id name isActive fulfillsOnlineOrders }
  }
  publications(first: 10) {
    nodes { id name }
  }
  products(first: 50) {
    nodes { id handle title }
  }
}`;

const CREATE_PRODUCT = `mutation CreateProduct($input: ProductSetInput!) {
  productSet(synchronous: true, input: $input) {
    product {
      id
      title
      handle
      status
      variants(first: 1) {
        nodes { id price sku }
      }
    }
    userErrors { field message }
  }
}`;

const PUBLISH = `mutation PublishProduct($id: ID!, $publicationId: ID!) {
  publishablePublish(id: $id, input: [{ publicationId: $publicationId }]) {
    userErrors { field message }
  }
}`;

const CREATE_COLLECTION = `mutation CreateCollection($collection: CollectionCreateInput!) {
  collectionCreate(collection: $collection) {
    collection { id title handle }
    userErrors { field message }
  }
}`;

const CREATE_PAGE = `mutation CreatePage($page: PageCreateInput!) {
  pageCreate(page: $page) {
    page { id title handle }
    userErrors { field message }
  }
}`;

function assertNoErrors(label, errors) {
  if (errors && errors.length) {
    throw new Error(`${label}: ${JSON.stringify(errors, null, 2)}`);
  }
}

function htmlDescription(product) {
  return `<p><strong>${product.tagline}</strong></p><p>${product.description}</p><p>Ships from our dropship partners. Free shipping on orders of $75 or more.</p>`;
}

const context = shopifyExecute(LOOKUP);
const LOCATION_ID =
  process.env.LOCATION_ID ||
  context.locations.nodes.find((l) => l.fulfillsOnlineOrders)?.id ||
  context.locations.nodes[0]?.id;
const PUBLICATION_ID =
  process.env.PUBLICATION_ID ||
  context.publications.nodes.find((p) => p.name === "Online Store")?.id;
if (!LOCATION_ID || !PUBLICATION_ID) {
  throw new Error(`Missing location or Online Store publication: ${JSON.stringify(context, null, 2)}`);
}
const existingByHandle = new Map(
  (context.products?.nodes || []).map((p) => [p.handle, p])
);

const created = [];
let createdNow = 0;
for (const product of products) {
  if (existingByHandle.has(product.handle)) {
    const existing = existingByHandle.get(product.handle);
    created.push(existing);
    console.log(`Skip existing ${existing.title} (${existing.id})`);
    continue;
  }
  createdNow += 1;
  const result = shopifyExecute(
    CREATE_PRODUCT,
    {
      input: {
        title: product.title,
        handle: product.handle,
        descriptionHtml: htmlDescription(product),
        vendor: "TiendaDrop",
        productType: product.productType,
        status: "ACTIVE",
        tags: product.tags,
        seo: {
          title: `${product.title} | TiendaDrop`,
          description: product.tagline,
        },
        files: [
          {
            originalSource: product.image,
            alt: product.imageAlt,
            contentType: "IMAGE",
            filename: `${product.handle}.jpg`,
          },
        ],
        productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
        variants: [
          {
            optionValues: [{ optionName: "Title", name: "Default Title" }],
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            sku: product.sku,
            inventoryPolicy: "CONTINUE",
            inventoryQuantities: [
              {
                locationId: LOCATION_ID,
                name: "on_hand",
                quantity: 100,
              },
            ],
          },
        ],
      },
    },
    { mutations: true }
  );
  assertNoErrors(`productSet ${product.handle}`, result.productSet?.userErrors);
  const createdProduct = result.productSet.product;
  created.push(createdProduct);
  const published = shopifyExecute(
    PUBLISH,
    { id: createdProduct.id, publicationId: PUBLICATION_ID },
    { mutations: true }
  );
  assertNoErrors(`publish ${product.handle}`, published.publishablePublish?.userErrors);
  console.log(`Created ${createdProduct.title} (${createdProduct.id})`);
}

if (createdNow === 0 && process.env.FORCE_SEED !== "1") {
  console.log("All catalog products already exist; skipping collections and pages.");
  console.log(
    JSON.stringify(
      { products: created.map((p) => ({ id: p.id, handle: p.handle, title: p.title })) },
      null,
      2
    )
  );
  process.exit(0);
}

const collections = [
  {
    title: "Featured",
    handle: "featured",
    descriptionHtml: "<p>Hand-picked gadgets from the TiendaDrop catalog.</p>",
    tag: "featured",
  },
  {
    title: "Audio",
    handle: "audio",
    descriptionHtml: "<p>Earbuds and everyday sound.</p>",
    productType: "Audio",
  },
  {
    title: "Wearables",
    handle: "wearables",
    descriptionHtml: "<p>Watches and on-the-go tech.</p>",
    productType: "Wearables",
  },
  {
    title: "Home & Lifestyle",
    handle: "home-lifestyle",
    descriptionHtml: "<p>Comfortable everyday essentials.</p>",
    types: ["Home", "Lifestyle"],
  },
  {
    title: "Fitness",
    handle: "fitness",
    descriptionHtml: "<p>Work out anywhere.</p>",
    productType: "Fitness",
  },
  {
    title: "Travel",
    handle: "travel",
    descriptionHtml: "<p>Bags and gear for the commute.</p>",
    productType: "Travel",
  },
];

const createdCollections = [];
for (const collection of collections) {
  const conditions = [];
  if (collection.tag) {
    conditions.push({
      productTag: { relation: "TAGGED_WITH", values: [collection.tag], matchType: "ANY" },
    });
  }
  if (collection.productType) {
    conditions.push({
      productType: { relation: "EQUALS", values: [collection.productType] },
    });
  }
  if (collection.types) {
    for (const type of collection.types) {
      conditions.push({ productType: { relation: "EQUALS", values: [type] } });
    }
  }

  const result = shopifyExecute(
    CREATE_COLLECTION,
    {
      collection: {
        title: collection.title,
        handle: collection.handle,
        descriptionHtml: collection.descriptionHtml,
        sources: [
          {
            source: {
              title: `${collection.title} source`,
              targetType: "PRODUCTS",
              inclusion: {
                matchType: "ANY",
                conditions,
              },
            },
          },
        ],
      },
    },
    { mutations: true }
  );
  assertNoErrors(`collection ${collection.handle}`, result.collectionCreate?.userErrors);
  const node = result.collectionCreate.collection;
  createdCollections.push(node);
  const published = shopifyExecute(
    PUBLISH,
    { id: node.id, publicationId: PUBLICATION_ID },
    { mutations: true }
  );
  assertNoErrors(`publish collection ${collection.handle}`, published.publishablePublish?.userErrors);
  console.log(`Created collection ${node.title} (${node.id})`);
}

const pages = [
  {
    title: "About",
    handle: "about",
    body: `<h2>About TiendaDrop</h2><p>TiendaDrop is a dropshipping store for everyday gadgets — audio, wearables, home, fitness, and travel gear selected for quality and value.</p><p>We source products from trusted partners and ship them directly to you. No warehouse markup, no waitlist.</p>`,
  },
  {
    title: "Shipping",
    handle: "shipping",
    body: `<h2>Shipping</h2><p>Standard shipping is <strong>$4.99</strong>.</p><p>Orders of <strong>$75 or more</strong> ship free.</p><p>Most items leave the partner warehouse within 1–3 business days. Tracking is emailed as soon as your order is on the way.</p>`,
  },
];

const createdPages = [];
for (const page of pages) {
  const result = shopifyExecute(
    CREATE_PAGE,
    { page: { title: page.title, handle: page.handle, body: page.body, isPublished: true } },
    { mutations: true }
  );
  assertNoErrors(`page ${page.handle}`, result.pageCreate?.userErrors);
  createdPages.push(result.pageCreate.page);
  console.log(`Created page ${page.title}`);
}

console.log(
  JSON.stringify(
    {
      products: created.map((p) => ({ id: p.id, handle: p.handle, title: p.title })),
      collections: createdCollections,
      pages: createdPages,
    },
    null,
    2
  )
);
