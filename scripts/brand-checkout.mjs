#!/usr/bin/env node
/**
 * Aplica logo y paleta CleanPro360 al checkout de Shopify.
 *
 * El checkout NO usa el tema Dawn. `preview_theme_id` no cambia logo ni colores.
 * Perfil publicado (2026-09): gid://shopify/CheckoutProfile/6453329964
 * Estado actual: brandSettings = null, cabecera = texto "Mi tienda".
 *
 * API (Plus / tienda de desarrollo):
 *   shopify store auth --store mm0afk-rw.myshopify.com \
 *     --scopes write_files,read_files,write_checkout_branding_settings,read_checkout_branding_settings
 *   node scripts/brand-checkout.mjs
 *
 * Editor visual (Basic+): Admin → Configuración → Pago → Configuraciones → Personalizar
 *   Logo: theme-overrides/assets/mt-logo.png (CDN /cdn/shop/t/3/assets/mt-logo.png)
 *   Alineación izquierda, ancho ~180px
 *   Acento / botones #0A5CFF  hover #084AD4
 *   Texto #0B1220  fondo #FFFFFF  resumen #F5F7FB  fuente Inter
 *   Nombre de tienda: Configuración → Datos de la tienda → CleanPro360
 */
import { shopifyExecute } from "./shopify-exec.mjs";

const LOGO_URL =
  process.env.CHECKOUT_LOGO_URL ||
  "https://mm0afk-rw.myshopify.com/cdn/shop/t/3/assets/mt-logo.png";
const FAVICON_URL =
  process.env.CHECKOUT_FAVICON_URL ||
  "https://mm0afk-rw.myshopify.com/cdn/shop/t/3/assets/mt-favicon.png";

const BRAND = "#0A5CFF";
const BRAND_HOVER = "#084AD4";
const TEXT = "#0B1220";
const BG = "#FFFFFF";
const SURFACE = "#F5F7FB";

const PROFILES = `query CheckoutProfiles {
  checkoutProfiles(first: 10) {
    nodes { id name isPublished }
  }
}`;

const FILE_CREATE = `mutation FileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files {
      id
      alt
      fileStatus
      ... on MediaImage { id }
    }
    userErrors { field message }
  }
}`;

const FILE_STATUS = `query FileStatus($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on MediaImage {
      id
      fileStatus
      image { url }
    }
  }
}`;

const BRANDING_UPSERT = `mutation BrandCheckout($checkoutProfileId: ID!, $checkoutBrandingInput: CheckoutBrandingInput!) {
  checkoutBrandingUpsert(
    checkoutProfileId: $checkoutProfileId
    checkoutBrandingInput: $checkoutBrandingInput
  ) {
    checkoutBranding {
      customizations {
        header {
          logo {
            image { url }
          }
        }
      }
      designSystem {
        colors {
          global { brand accent }
        }
      }
    }
    userErrors { field message }
  }
}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitReady(ids) {
  for (let i = 0; i < 20; i += 1) {
    const data = shopifyExecute(FILE_STATUS, { ids });
    const nodes = data.nodes || [];
    const pending = nodes.filter((n) => n && n.fileStatus && n.fileStatus !== "READY");
    if (!pending.length && nodes.every((n) => n?.id)) return nodes;
    await sleep(1500);
  }
  throw new Error("Timeout waiting for uploaded images");
}

function brandingInput(logoId, faviconId) {
  return {
    designSystem: {
      colors: {
        global: {
          brand: BRAND,
          accent: BRAND,
        },
        schemes: {
          scheme1: {
            base: { background: BG, text: TEXT },
            control: {
              background: BG,
              border: "#D0D5DD",
              selected: { background: BRAND, border: BRAND },
            },
            primaryButton: {
              background: BRAND,
              hover: { background: BRAND_HOVER },
            },
          },
          scheme2: {
            base: { background: SURFACE, text: TEXT },
          },
        },
      },
      typography: {
        primary: {
          shopifyFontGroup: { name: "Inter" },
        },
        secondary: {
          shopifyFontGroup: { name: "Inter" },
        },
      },
      cornerRadius: { base: 8 },
    },
    customizations: {
      header: {
        alignment: "START",
        logo: {
          image: { mediaImageId: logoId },
          maxWidth: 180,
        },
      },
      favicon: faviconId ? { image: { mediaImageId: faviconId } } : undefined,
      primaryButton: {
        cornerRadius: "BASE",
      },
    },
  };
}

const profiles = shopifyExecute(PROFILES);
const published =
  profiles.checkoutProfiles.nodes.find((n) => n.isPublished) ||
  profiles.checkoutProfiles.nodes.find((n) => n.id.includes("6453329964")) ||
  profiles.checkoutProfiles.nodes[0];
if (!published) throw new Error("No checkout profile found");
console.log(`Using checkout profile ${published.name} (${published.id})`);

const created = shopifyExecute(
  FILE_CREATE,
  {
    files: [
      { alt: "CleanPro360", filename: "cleanpro360-checkout-logo.png", originalSource: LOGO_URL, contentType: "IMAGE" },
      { alt: "CleanPro360", filename: "cleanpro360-checkout-favicon.png", originalSource: FAVICON_URL, contentType: "IMAGE" },
    ],
  },
  { mutations: true }
);
if (created.fileCreate.userErrors?.length) {
  throw new Error(JSON.stringify(created.fileCreate.userErrors, null, 2));
}
const fileIds = created.fileCreate.files.map((f) => f.id);
const ready = await waitReady(fileIds);
const logoId = ready[0].id;
const faviconId = ready[1]?.id;
console.log("Uploaded", logoId, faviconId);

const result = shopifyExecute(
  BRANDING_UPSERT,
  {
    checkoutProfileId: published.id,
    checkoutBrandingInput: brandingInput(logoId, faviconId),
  },
  { mutations: true }
);
if (result.checkoutBrandingUpsert.userErrors?.length) {
  throw new Error(JSON.stringify(result.checkoutBrandingUpsert.userErrors, null, 2));
}
console.log("Checkout branding applied.");
console.log(JSON.stringify(result.checkoutBrandingUpsert.checkoutBranding, null, 2));
