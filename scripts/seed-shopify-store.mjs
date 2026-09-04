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

function assertNoErrors(label, errors) {
  if (errors && errors.length) {
    throw new Error(`${label}: ${JSON.stringify(errors, null, 2)}`);
  }
}

function htmlDescription(product) {
  return `<p><strong>${product.tagline}</strong></p><p>${product.description}</p><p>Envío a Colombia. El costo se calcula al checkout, según tu ciudad.</p>`;
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
  const files = product.image
    ? [
        {
          originalSource: product.image,
          alt: product.imageAlt || product.title,
          contentType: "IMAGE",
          filename: `${product.handle}.jpg`,
        },
      ]
    : [];
  const result = shopifyExecute(
    CREATE_PRODUCT,
    {
      input: {
        title: product.title,
        handle: product.handle,
        descriptionHtml: htmlDescription(product),
        vendor: "CleanPro360",
        productType: product.productType,
        status: "ACTIVE",
        tags: product.tags,
        seo: {
          title: `${product.title} | CleanPro360`,
          description: product.tagline,
        },
        ...(files.length ? { files } : {}),
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

console.log("Skipping leftover USD gadget collections and pages. This store is CleanPro360 (COP).");
console.log(
  JSON.stringify(
    {
      products: created.map((p) => ({ id: p.id, handle: p.handle, title: p.title })),
      collections: [],
      pages: [],
    },
    null,
    2
  )
);
process.exit(0);
