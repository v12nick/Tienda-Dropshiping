# Mi tienda (CleanPro360)

Shopify store: [admin.shopify.com/store/mm0afk-rw](https://admin.shopify.com/store/mm0afk-rw)

Storefront: https://mm0afk-rw.myshopify.com

## Live catalog

| Product | Price (COP) | Compare at |
| --- | --- | --- |
| CleanPro360 – Cepillo Eléctrico Multiusos | $99.900 | $149.900 |

This is a Colombia (COP) dropshipping store. The homepage hero is in Spanish and links to CleanPro360. Inventory is set to keep selling when stock hits zero (dropship).

## Theme

`shopify.theme.toml` points at `mm0afk-rw.myshopify.com`. Homepage copy lives in `theme-overrides/templates/index.json`. Push it with:

```bash
shopify theme push --store mm0afk-rw.myshopify.com --live --allow-live --nodelete --only templates/index.json --path theme-overrides
```

## Seed extra products

`catalog/products.json` is the current live product. `npm run seed` can add more products after Shopify CLI store auth.
