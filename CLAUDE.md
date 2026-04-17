# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static frontend for **Positivo Hogar** — a home-appliances store in Wilde, Buenos Aires with two branches ("Las Flores" and "Mitre"). The site is a catalog only: customers browse products and complete the purchase over WhatsApp. There is no build step and no framework; pages are plain HTML + CSS + vanilla JS served as-is.

The catalog data is fetched live from a custom WooCommerce REST endpoint:

```
https://positivohogar.com.ar/api/wp-json/positivo/v1/products
```

`productos-mock.json` is only a fixture for reference — it is not loaded at runtime.

## Development

There is no bundler, no package.json, no tests. To work on the site locally, serve the folder over HTTP (the JS uses `fetch("components/header.html")` etc., which requires a real origin — opening `file://` breaks it):

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

Deployment is "upload the files". Cache-busting is done manually with `?v=NN` query strings on `<script>`/`<link>` tags — bump those when you change `java.js`, `producto.js`, or `style.css`.

## Directory layout

```
/                       HTML pages, robots.txt, sitemap.xml, favicon.ico
├── css/                style.css
├── js/                 main.js (home + shared), producto.js, categoria.js, busqueda.js
├── components/         header.html, footer.html, main.html (fetched at runtime)
├── assets/
│   ├── banners/        banner_principal* slider images
│   ├── logos/          logo-bueno.png, whatsapp-logo.png
│   └── icons/          favicon-*.png variants
└── data/               productos-mock.json (fixture only, not loaded at runtime)
```

`robots.txt`, `sitemap.xml`, and `favicon.ico` **must stay in root** — crawlers and browsers hit them at `/robots.txt`, `/sitemap.xml`, `/favicon.ico`.

## Page → script wiring

| Page | Scripts loaded | Role |
|---|---|---|
| `index.html` | `js/main.js` | Home. Loads header/main/footer partials, renders category sliders + ofertas. |
| `categoria.html` | `js/categoria.js`, `js/main.js` | Category listing with subcategory sidebar filter. |
| `busqueda.html` | `js/busqueda.js` (+ `js/main.js`) | Search results for `?q=` term. |
| `muestra-producto.html` | `js/producto.js`, `js/main.js` | Single product detail, driven by `?id=`. |

`js/main.js` is loaded on every page because it owns the header/footer injection and WhatsApp CTA wiring — not just the home logic. The home-specific rendering inside it is gated by `isIndexPage` checks against `window.location.pathname`.

`components/header.html`, `components/footer.html`, and `components/main.html` are fetched at runtime and injected into `#site-header`, `#site-footer`, `#site-main`. Any DOM behavior that depends on header/footer elements must be wired **inside the `.then(...)` of those fetches**, not at script top-level, because the elements don't exist yet when the script runs.

## Catalog data flow (important — don't break it)

Every page that lists products follows the same three-tier pattern:

1. **In-memory** (`window.productosDB` + `window.productosDB_version`) — fastest, survives within a page.
2. **`sessionStorage`** under key `productosDB_<VERSION>` — survives across navigations in the same tab. This is the key performance optimization: navigating from home → product detail should hit cache, not refetch.
3. **Network** — single `fetch` of the full catalog, then `.map(mapearProductoWC)` once.

Each script declares its own `CACHE_VERSION` constant (`v12` in java.js, `v10` in producto.js, `v11` in busqueda.js, `v19` in categoria.js). **These versions are deliberately different per file** — the category page uses a richer mapping (subcategory + categoria principal), so it must not reuse the home page's cache entry. If you change the shape of a mapped product in one file, bump that file's `CACHE_VERSION` so old cached blobs are invalidated.

`producto.js` has an extra fallback: if the full-catalog cache misses, it hits `/products/:id` directly before falling back to downloading the full list. Preserve this ordering.

## Category taxonomy (the tricky part)

WooCommerce returns raw category slugs; the UI groups them into a fixed set of buckets. The mapping lives in different files for different pages and **is not shared** — updating category logic usually means editing multiple files.

- **`java.js` (home)** — `SUBCATEGORIAS`, `CATEGORIAS_VISIBLES_MAIN`, `NOMBRES_CATEGORIAS`. Picks the **most specific** category (highest `id`) as the product's bucket.
- **`categoria.js` (category page)** — `CATEGORIAS_PAGINA` (the 10 UI categories), `PARENTCAT_A_UI` (WC parent slug → UI bucket), `SUBCAT_A_UI` (overrides, e.g. air conditioners live under `linea-blanca-1` in WC but must appear in Climatización), plus a huge `NOMBRES_SLUG` lookup for human-readable labels. Picks **categoria principal** via override → parent, and **subcategoria** via most-specific leaf.
- **`producto.js` / `busqueda.js`** — take the lowest-id (most general) category as `categoria`.

When adding a new WooCommerce category, check all four files. Categorization bugs almost always trace back to one of these maps being out of sync with WC.

Products with `stock === 0` (or `<= 0` where the field is nullable) are hidden everywhere that lists products. Products in the `oferta` slug go into the "OFERTAS DEL MES" slider on home and are filtered out when determining categoria.

## Product descriptions

WooCommerce stores the description as HTML. `parsearDescripcionHTML` (duplicated in java.js, producto.js, busqueda.js, categoria.js with a `parsearDescCat` variant) splits on a literal `Características:` marker: text before it becomes the description, `<li>` items after it become `{label, value}` pairs for the spec table. Product authors in WooCommerce must follow that format or the spec list renders empty.

## WhatsApp CTAs

Every `.whatsapp` anchor gets its `href` rewritten at runtime. Two numbers — `5491132330738` (Las Flores) and `5491132904840` (Mitre). Sucursal is detected via `data-sucursal` attribute (preferred) or by string-matching `"mitre"` in the element's text content (legacy fallback in header). On the product detail page the message includes the product name and price; everywhere else it's a generic greeting.

## SEO

`index.html`, `categoria.html`, and `muestra-producto.html` all include hidden "static content for Googlebot" sections (absolutely-positioned, `clip:rect(0,0,0,0)`) and JSON-LD schema. `muestra-producto.html` rewrites `<title>`, meta description, OG tags, and injects a `Product` JSON-LD schema dynamically via `window.actualizarMetaProducto` once the product loads. Don't remove these — the site relies on them for organic traffic since the real content is client-rendered.

## Known loose ends

- `chat-widget.js` is referenced with `<script src="chat-widget.js" defer>` in several HTML files but the file is not in the repo. Requests 404 silently.
- `java.js` calls `mostrarSoloCategoria(hash)` but the function is never defined anywhere. The hash-navigation path is effectively dead code.
- The four `parsearDescripcionHTML` copies have drifted slightly; if you fix a parsing bug, fix it in all copies.
