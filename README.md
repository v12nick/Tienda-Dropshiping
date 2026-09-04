# CleanPro360 (mm0afk-rw)

Storefront: https://mm0afk-rw.myshopify.com

Live theme: **CleanPro360 (Claude)** `#151107371052` (Dawn + secciones `mt-*`). Horizon queda unpublished.

Custom files live in `theme-overrides/` and are pushed to the live Dawn theme. Do not import leftover USD gadget catalogs. The store is Colombia / COP.

Product: CleanPro360 – Cepillo Eléctrico Multiusos (`cleanpro360-cepillo-electrico-multiusos`), 99900 COP.

Push live:

```bash
shopify theme pull --store mm0afk-rw.myshopify.com --theme 151107371052 --path ./theme-live
# copy updated files from theme-overrides into theme-live, then:
shopify theme push --store mm0afk-rw.myshopify.com --theme 151107371052 --allow-live --path ./theme-live
```
