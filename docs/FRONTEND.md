# Frontend

React 19 SPA in [frontend/](../frontend), built with Vite 8, styled with Tailwind v4, deployed to Vercel. Pure client-side rendering — no SSR, no prerender.

## Stack

| | |
|---|---|
| React | 19.2 (`StrictMode` on) |
| Router | `react-router-dom` 7.16, `BrowserRouter`, flat routes |
| Build | Vite 8 + `@vitejs/plugin-react` |
| Styling | Tailwind v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**, configured with `@theme` in `src/index.css` |
| Animation | `framer-motion` 12.40 (entrances only) + hand-written CSS keyframes |
| Analytics | `@vercel/analytics` (zero-config, auto page views) |

No TypeScript, no PropTypes, no tests, no Prettier, no pre-commit hooks. Lint is flat-config ESLint (`npm run lint`).

## Bootstrapping

`src/main.jsx` → `src/App.jsx`:

```
StrictMode
└─ BrowserRouter
   └─ CartProvider        ← DEAD (see below)
      └─ FavoriteProvider ← DEAD
         └─ App
            └─ MotionConfig reducedMotion="user"
               └─ LanguageProvider
                  └─ CartProvider      ← the live one
                     └─ FavoriteProvider ← the live one
                        ├─ ScrollToTop
                        ├─ Navbar
                        ├─ Suspense fallback={null} → Routes
                        ├─ Footer
                        └─ Analytics
```

> **`CartProvider` and `FavoriteProvider` are mounted twice.** Consumers resolve to the nearest provider, so the inner pair wins and the outer pair in `main.jsx` is unreachable dead state (it still allocates state and re-reads `localStorage`). Not a bug today, but delete the outer two from `main.jsx`.

`ScrollToTop` resets scroll on `pathname` change only — search/hash navigation deliberately does not reset, because the Menu page uses in-page anchors.

## Routes

| Path | Component | Loading |
|---|---|---|
| `/` | `Home` | eager |
| `/menu` | `Menu` | `lazy()` |
| `/order` | `Order` | `lazy()` |
| `/subscription` | `Subscription` | `lazy()` |
| `/favorite` | `Favorite` | `lazy()` |
| `/catering` | `Catering` | `lazy()` |
| `*` | `NotFound` | `lazy()` |

Flat — no nested or layout routes. The "shell" is just `Navbar` above `<Routes>` and `Footer` below, both outside `Suspense` so they never flash. `Suspense fallback={null}` means no visible loading UI during chunk loads.

Unknown URLs return **HTTP 200** (Vercel rewrites everything to `index.html`) with a client-rendered `NotFound`.

## State management

Three hand-rolled contexts. No reducer, no store library, no `useMemo` on provider values. All persist to `localStorage` synchronously inside the state updater (not via `useEffect`).

### CartContext — `localStorage['cart']`

```js
{ cartItems, totalQuantity, getCartItem, addToCart, removeFromCart, dayConflict, dismissDayConflict }
```

**Cart item shape — exactly:**

```js
{ productId, quantity: 1, portion: 'single' | 'family', day: 'monday' | null }
```

- **Line identity is the `(productId, portion)` pair.** The same dish in single + family is two independent lines.
- Stores **no price and no name.** The Order page re-fetches `/api/products` and joins by id — which is why a deleted product renders as the literal string "Item no longer available", and why a backend price change applies retroactively to items already in the cart.
- All id comparisons are `String()`-coerced on both sides. `portion` is compared with `===` and is **not** coerced.
- `addToCart(productId, productDay, portion)` returns `boolean` — `false` means a day conflict blocked it.
- `removeFromCart` deletes the line when `quantity <= 1`.

### FavoriteContext — `localStorage['favorite']` (singular)

```js
{ favoriteItems, isFavorite, toggleFavorite, removeFromFavorite }
```

Item shape is `{ productId }` — ids only, no denormalized data. There is no favorites endpoint; `/favorite` fetches all products and filters client-side.

### LanguageContext — `localStorage['site-language']`

```js
{ language: 'en' | 'ar', toggleLanguage }
```

Defaults to `'en'` for any value that isn't exactly `'ar'`. An effect sets `document.documentElement.lang`. Only `toggleLanguage` persists — a first-time visitor has no stored entry until they toggle.

### Shared caveats

- **No cross-tab sync** — no `storage` event listener anywhere. Two open tabs diverge; last write wins.
- **Writes are unguarded** — no try/catch around `setItem`, so Safari private mode or a quota error throws out of `addToCart`.
- Reads happen at component-call time, which would throw under SSR (`localStorage is not defined`). Fine for this pure-CSR app.

## The ordering flow

**Read this before touching the cart or the Order page.**

1. **Browse** — `/menu`, `/` (Plat du Jour rail), or `/favorite` fetch `GET /api/products` through the cached `fetchJSON`. Products are filtered by `isProductAvailable` first.
2. **Open overlay** — clicking a `ProductCard` mounts `ProductOverlay`; body scroll locks.
3. **Pick portion** — `portion` defaults to `'single'`, resets whenever `product.id` changes. The Family toggle renders only when `typeof product.price.family === 'number'`. **The user never picks a day** — the day is a property of the product and rides along into the cart item. No notes, no modifiers.
4. **Add** — `addToCart` merges into an existing `(productId, portion)` line or appends a new one, then writes `localStorage`.
5. **Confirm** — if `addToCart` returned `true`, `BasketNotification` animates over the product image for ~1.8s. The navbar badge updates from `totalQuantity`.
6. **Review** — `/order` joins cart lines against a fresh `/api/products` fetch, computes `subtotal` in cents, allows in-place quantity edits. Products with `order_unit: "dozen"` show `/ dozen` and label the quantity control as dozens.
7. **Submit** — **there is none.**

> ### Checkout is not implemented
>
> Every customer-details input on `/order` is `readOnly` and unbound to state. The Pickup/Delivery buttons and the "Place Order" button have **no handlers**. A `<ComingSoonOverlay />` renders unconditionally over the page ("Ordering is coming soon"), deliberately without locking body scroll.
>
> The backend confirms it: there is no order model, no `POST` endpoint, no mailer. No frontend code builds a WhatsApp message from `cartItems` either.
>
> The only working order channels today are manual: the generic WhatsApp link in `socialLinks`, the subscription-specific WhatsApp deep link on `/subscription`, and the `tel:`/`mailto:` links in the footer. **Wiring checkout needs both a new backend endpoint and form state on `/order`.**
>
> Also note: Order Summary renders `subtotal` for both the Subtotal and the Total line. No delivery fee, no tax. A `#delivery-fee` selector survives in `index.css` from the pre-React build but nothing computes one.

## The day-conflict rule

Non-obvious domain logic. Plat-du-jour dishes are cooked in one daily batch, so **a basket may only carry dishes for one weekday.**

Two separate rules, both in [frontend/src/utils/days.js](../frontend/src/utils/days.js) and `CartContext`:

**Availability** (`isProductAvailable`, filters the menu):

```js
if (!product.day) return true                                   // day-less: always available
if (productDayIdx < currentDayIdx) return false                 // day already passed this week
if (productDayIdx === currentDayIdx && currentHour >= 17) return false  // same-day 5pm cutoff
return true
```

`DAYS_OF_WEEK` is Sunday-indexed to match `Date#getDay()`. `DAY_ORDER` is a *separate*, Monday-first map used only for display sorting.

- **No week wraparound.** On Friday, Monday's and Tuesday's dishes disappear entirely rather than rolling to next week. Looks deliberate; worth confirming with the owner.
- Uses the **browser's local clock and timezone**, not the server's — a customer abroad sees a different cutoff than Beirut.
- Pure render-time function with **no timer** — a page left open across 17:00 doesn't re-hide the item until something re-renders.

**Conflict** (`addToCart`):

```js
const cartDay = cartItems.find(i => i.day)?.day ?? null   // day of the FIRST dated line
if (productDay && cartDay && cartDay !== productDay) {
  setDayConflict({ currentDay: cartDay, productDay })
  return false                                             // nothing added, localStorage untouched
}
```

Consequences:
- Adding a **day-less** product never conflicts and never sets the cart day.
- Adding a dated product to a basket of only day-less items is allowed — and that add *establishes* the cart day, retroactively constraining the basket.
- **The modal offers exactly one action: "Close."** No "replace basket", no "clear and add". The user's only recourse is to manually empty the basket on `/order`. If a "start a new basket for {day}" action was intended, it isn't implemented.
- `DayConflictModal` is mounted by `Home`, `Menu`, and `Favorite` — **not** by `Order`.

## API layer

[frontend/src/utils/api.js](../frontend/src/utils/api.js) — 24 lines, two exports.

```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
export async function fetchJSON(path)   // GET only, no options param
```

**The cache** (commit `63d1dd0`):

- `Map` keyed by the raw `path` string, module-scoped (dies on reload, not shared across tabs, not persisted).
- TTL 10 minutes, stamped at *request start* so latency counts against it.
- **Stores the promise, not the value** — so cache-hit and in-flight dedupe are the same mechanism, with no separate pending registry.
- `promise.catch(() => cache.delete(path))` self-evicts failures so the next caller retries.
- **No manual invalidation API.** No `clearCache()`, no bypass flag. Forcing fresh data requires a full page reload.

Error handling is `if (!res.ok) throw new Error(\`HTTP ${res.status}\`)` — the error body is discarded, so backend messages never reach the UI. No retry, no timeout, no `AbortSignal`.

> **The most likely misconfiguration in this repo:** `VITE_API_BASE_URL` unset in production. It falls back to `''` (same-origin), Vercel's catch-all rewrite returns `index.html` with a 200 for `/api/*`, and the failure surfaces as an opaque JSON parse error. There is also no Vite dev proxy, so the same applies locally.

## Pages

| Page | Fetches | Notes |
|---|---|---|
| `Home` | `/api/slideshow`, `/api/products` | Hero carousel is **imperative DOM `transform` manipulation** on an interval, not framer-motion, with a cloned first slide for seamless looping. Plat Du Jour rail filters `category === 'plat-du-jour'` + `isProductAvailable`. Passes **raw** API objects to `ProductCard` (no `mapProduct`). |
| `Menu` | `/api/categories`, `/api/products` via `Promise.allSettled` | The biggest page (572 lines). Category tabs are **portalled into the site header** via `createPortal(…, document.querySelector('header.header-js'))`. Filter drawer holds `Set` instances in state. Filter pipeline is an unmemoized IIFE recomputed every render. |
| `Order` | `/api/products` (skipped when cart is empty) | See the checkout warning above. Uses raw API objects, not `mapProduct`. |
| `Catering` | `/api/catering-menus` | A **gallery of menu images** (photos/scans), not structured data. Lightbox with keyboard + swipe nav, no wraparound. Only page with its own stylesheet (`Catering.css`) and the only consumer of `useHeroReady`. |
| `Subscription` | `/api/subscriptions` | Price list + contact card. **No cart involvement.** Two tables (1 Person / Family of 4). Prices printed raw — these are dollars, not cents. The only page with a distinct error state. |
| `Favorite` | `/api/products` (skipped when empty) | Resolves stored ids against the full product list. `FavoriteCard` hard-codes portion `'single'`. |
| `NotFound` | — | Static. |

All seven call `useSEO(...)`.

**Loading/empty/error convention:** every data page has a `loading` boolean initialised `true`, hand-rolled `animate-pulse` skeletons, then an empty state. **Errors are almost never surfaced** — `catch` blocks set the collection to `[]`, so a down API is indistinguishable from an empty catalogue. `Subscription` is the sole exception.

## Components

| Component | Key props | Notes |
|---|---|---|
| `ProductCard` | `product`, `onOpen?`, `className?`, `style?` | Tolerates both mapped (`nameAr`) and raw (`name_ar`) shapes. `order_unit: "dozen"` adds a visible badge and `/ dozen` to its price. Not clickable without `onOpen`. |
| `ProductOverlay` | `product`, `onClose` | Portion selector renders only when a family price exists. Dozen products repeat the 12-piece rule and make the add action explicit. Locks body scroll. `triggerNotification(true)` fires only when `addToCart` returned `true`. |
| `QuantityStepper` | `quantity`, `onDecrease`, `onIncrease`, `size?`, `unitLabel?` | Stateless pill; `unitLabel` improves its accessible quantity and button labels. |
| `HeartButton` | `productId`, `size?` | Hidden checkbox + CSS sibling selectors drive fill and the bounce keyframes. `stopPropagation` so it never opens the overlay. The `'lg'` size is currently unused. |
| `BasketNotification` | `isAdding`, `onDone`, `size?` | 3-phase state machine (`entering`/`visible`/`leaving`), 1500ms + 1800ms timers. **Fully inline styles**, no Tailwind. Remounted via a changing `key` to replay. |
| `DayConflictModal` | `currentDay`, `productDay`, `onClose` | See the day-conflict section. |
| `Navbar` | — | Owns the `--header-height` measurement and is the portal target for Menu's category tabs. |
| `Footer` | — | Address, tel, mailto, lazy Google Maps iframe, social row. |
| `siteLinks.jsx` | — | **Not a component** — exports the `navLinks` and `socialLinks` data arrays shared by Navbar and Footer. |
| `icons.jsx` | `className` | Ten stateless SVGs. Note Home's `FEATURES` and `Subscription` inline duplicate SVGs rather than importing these. |

## Utils

`pricing.js` also exposes `isSoldByDozen(product)`, which accepts both raw API
and mapped product shapes. `mapProduct.js` maps `order_unit` to `orderUnit`,
defaulting unknown or legacy responses to `each`.

| File | Purpose |
|---|---|
| `pricing.js` | `formatCurrency(cents)` → `"19.00"` string, no symbol (call sites prepend `<span translate="no">$</span>`). `getProductPrice(product, portion)` → number \| null; `'family'` **falls back to the single price** when no family variant exists. |
| `days.js` | `DAYS_OF_WEEK` (Sunday-indexed), `DAY_ORDER` (Monday-first, display only), `capitalize`, `isProductAvailable`. |
| `mapProduct.js` | Backend → frontend whitelist. Only real rename is `name_ar` → `nameAr` (defaulting to `''`). **Applied on `/menu` and `/favorite` only** — Home and Order use raw shapes, which is why they can't show Arabic names. |
| `imagePlaceholder.js` | `resolveProductImageSrc(image, name)` — absolute URL / root-relative / `data:` pass through; a bare filename gets `/assets/images/` prefixed; empty falls back to `buildPlaceholderDataUrl(name)`, an inline SVG in one of 5 warm tints picked deterministically by hashing the name. Zero network cost, no layout shift. |
| `useHeroReady.js` | Toggles `hero-loading`/`hero-ready` body classes to drive CSS transitions. Idempotent `markReady`. Only used by Catering. Lives in `utils/` rather than `hooks/` — inconsistent placement. |
| `hooks/useSEO.js` | Imperatively mutates the tags already in `index.html`: title, description, og:title/description, twitter:title/description, and creates-or-updates the canonical link against a hard-coded `SITE_URL`. **Does not update `og:image` or `og:url`.** Client-side only, so non-JS crawlers see only the static head. |

## i18n and RTL

**This is a product-name-only bilingual layer.** There is no i18n library, no translation catalog, no `t()` function.

The only translated content is the product name, at exactly two call sites (`ProductCard`, `ProductOverlay`):

```js
const nameAr = product.nameAr || product.name_ar
const displayName = language === 'ar' && nameAr ? nameAr : product.name
```

Everything else — nav labels, buttons, empty states, and all of Order/Subscription/Catering/NotFound copy, plus every SEO string — is **hard-coded English** and does not change with the toggle.

> **RTL is not implemented.** No `dir` attribute is ever set, no `[dir="rtl"]` styles, no logical properties (`ms-`/`me-`/`ps-`/`pe-`) — every offset is physical (`left-0`, `right-4`, `mr-3`). Selecting Arabic sets `<html lang="ar">` and swaps product names; the layout stays LTR. Treat RTL as unimplemented, not partial.

No Arabic font is loaded either — `index.html` fetches only Playfair Display and Lora.

## Styling

Tailwind v4, **CSS-first config**. No `tailwind.config.js`, no `postcss.config.js`, no `content` globs. Wired through the `tailwindcss()` Vite plugin plus `@import "tailwindcss";` at the top of `src/index.css`.

**Tokens are declared twice, deliberately**, in `src/index.css`:
- `@theme { --color-* }` — generates Tailwind utilities (`bg-background`, `text-muted`, …)
- `:root { --* }` — the same palette unprefixed, for the hand-written CSS in the same file

They must be kept in sync by hand.

| Token | Value |
|---|---|
| background | `#FDF8F5` |
| surface | `#FFF3EC` |
| primary | `#E8822A` |
| secondary | `#da5825` |
| cta | `#521C0D` |
| accent / text | `#3E160A` |
| muted | `#8A4B3A` |

`:root` also carries `--header-height: 84px` (written at runtime by `Navbar`), `--font-base` (Playfair Display), and `--font-numeric` (Larosa Sans — **never actually loaded**, so numerics fall through to system-ui).

Conventions:
- **All `:hover` styles are gated behind `lg:` / `@media (min-width: 1024px)`** so touch devices don't get sticky hover states.
- Shared drawer idiom (Navbar sidebar and Menu filter drawer, verbatim): `fixed top-0 w-[75%] sm:w-[50%] lg:w-[33%] h-[100vh] duration-500 z-30`, toggling `left-0` against `left-[-75%] sm:left-[-50%] lg:left-[-33%]`.
- Shared overlay idiom: `fixed inset-0 bg-black/50 z-50`, closed by comparing `e.target === e.currentTarget`, with body scroll locked on mount.
- `.overflow-x-auto` is **globally overridden** to hide scrollbars — this reuses a Tailwind utility name, so every `overflow-x-auto` in the app silently loses its scrollbar.
- `framer-motion` is used sparingly and only for entrances. Home's hero and all of Catering animate with plain CSS keyframes instead.

**Legacy `-js` class names** (`header-js`, `side-bar-js`, `price-js`, `js-menu-search`, `js-cart-quantity`, `portion-container-js`, …) survive from the pre-React vanilla-JS build. Most are now just CSS hooks — but `header.header-js` is **load-bearing**: it's the Menu page's `createPortal` target and the `--header-height` measurement target. Don't strip them blindly.

`src/App.css` is a 0-byte file imported by nothing. Safe to delete.

## Build and deploy

- `vite.config.js` is minimal — react + tailwind plugins, nothing else. No aliases, **no dev proxy**, no manual chunking (code-splitting comes only from the `lazy()` calls).
- `vercel.json` is a single catch-all SPA rewrite: `/(.*)` → `/index.html`. No headers, no caching directives.
- **One env var exists anywhere in the codebase: `VITE_API_BASE_URL`.** No `.env*` file is committed and there is no `.env.example`.
- `frontend/README.md` is the **unmodified Vite starter template** — it documents nothing about this project.

### Static SEO files in `public/`

| File | Contents |
|---|---|
| `sitemap.xml` | 4 URLs: `/`, `/menu` (daily), `/catering`, `/subscription`. No `<lastmod>`. `/order` and `/favorite` deliberately excluded. |
| `robots.txt` | Allow all; `Disallow: /order` and `/favorite`. Then explicit allow blocks for `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `CCBot` — note these per-bot blocks **do not repeat the disallows**, so named crawlers are permitted everywhere. |
| `llms.txt` | AI-crawler brief: key pages, categories, portions, the 5pm plat-du-jour rule, $7–$19 range, location, contacts. |
| `site.webmanifest` | Standalone display, brand colors. **One 459×459 icon** — no 192/512, no maskable purpose, and no service worker, so PWA installability will fail Lighthouse. |

`index.html` carries the base meta, Open Graph, Twitter card, a `FoodEstablishment` JSON-LD block, and a real `<noscript>` fallback with address and phone.
