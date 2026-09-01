# TiendaDrop

Dropshipping catalog and store scripts for [TiendaDrop](https://admin.shopify.com/store/mm0afk-rw) (`mm0afk-rw.myshopify.com`).

## Catalog

Eight starter products (audio, wearables, home, lifestyle, fitness, accessories, travel), with **$4.99** shipping and **free shipping at $75+**.

| Product | Price |
| --- | --- |
| Aurora Wireless Earbuds | $59.99 |
| Nimbus Smartwatch | $89.99 |
| Lumen LED Desk Lamp | $34.99 |
| Terra Insulated Bottle | $24.99 |
| Pulse Resistance Band Set | $29.99 |
| Orbit Magnetic Phone Stand | $39.99 |
| Breeze Portable Mini Fan | $19.99 |
| Cosmo Anti-Theft Backpack | $49.99 |

Product data lives in `catalog/products.json`.

## Load the catalog onto the store

After Shopify CLI is logged in to this store:

```bash
npm run seed
```

That creates the products, publishes them to the Online Store, adds collections (Featured, Audio, Wearables, Home & Lifestyle, Fitness, Travel), and publishes About / Shipping pages.

## Theme

`shopify.theme.toml` points theme commands at `mm0afk-rw.myshopify.com`.
