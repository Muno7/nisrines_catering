# Gotchas

Traps, inconsistencies, and dead code found while reading the whole codebase. **Read this before writing any code here.** Nothing below is speculative — each item was verified in the source.

## Will bite you immediately

### Money uses two different units
- **Product prices are integer cents** (`priceSingleCents`, `priceFamilyCents`). The API emits raw cents; the frontend divides by 100 via `formatCurrency`; the admin renders them through the `money_cents` Jinja filter.
- **Subscription prices are whole dollars** (`price_plat_du_jour`, `price_with_salad`). Form labels say `($)`, templates print them raw, `Subscription.jsx` prints them raw.

There is no currency code stored anywhere; USD is implied. No `Decimal` or float — all money is `Integer`.

### `VITE_API_BASE_URL` unset in production fails silently and confusingly
It falls back to `''` (same-origin). Vercel's catch-all rewrite then returns `index.html` with HTTP **200** for `/api/*`, and the failure surfaces as an opaque JSON parse error rather than a 404. There is no `.env.example` and no Vite dev proxy, so the same applies locally.

### A fresh deployment cannot log into `/admin`
Nothing in the container start path creates an admin. Run it by hand:
```bash
docker compose exec api flask create-admin
```

### `family: 0` is indistinguishable from "no family price"
`Product.to_dict` uses `self.priceFamilyCents if self.priceFamilyCents else None` — a truthiness check, not `is None`. A stored `0` serializes as `null`.

### Renaming a category changes the public API for every one of its products
The public `category` field is the **slug**, derived from the name inside `Category.set_name`. Rename the category and every product's `category` value changes. Anything hardcoded to a slug (e.g. `'plat-du-jour'`, which `Home.jsx` filters on) breaks.

### `Product.set_name` destroys internal capitalization
`text[:1].upper() + text[1:].lower()` runs on every create, update, and duplicate. `"BBQ Chicken"` becomes `"Bbq chicken"`. `name_ar` is deliberately exempt.

## Doesn't work / isn't implemented

### Checkout does not exist
Every input on `/order` is `readOnly` and unbound; the Pickup/Delivery and "Place Order" buttons have **no handlers**; a "Coming soon" overlay renders unconditionally. The backend has no order model and no write endpoint. Orders happen over WhatsApp/phone/email. See [FRONTEND.md](FRONTEND.md#the-ordering-flow).

Also: Order Summary renders the same `subtotal` for both the Subtotal and Total lines. No delivery fee, no tax — despite a `#delivery-fee` selector surviving in `index.css`.

### RTL is not implemented
There is an Arabic toggle, but no `dir` attribute is ever set, no `[dir="rtl"]` styles exist, no logical properties are used, and no Arabic font is loaded. Switching to AR sets `<html lang="ar">` and swaps **product names only** — every other string in the app is hardcoded English. Treat RTL as unimplemented, not partial.

### Nothing is ever deleted from S3
No `delete_object` call exists anywhere in `app/`. Deleting a product, slide, or catering image removes only the DB row. Because keys are content-addressed (`products/{sha256}.{ext}`) and `duplicate()` reuses the URL, **several rows can point at the same object** — any future cleanup must be reference-counted, not naive.

Relatedly: there is **no way to clear a product image** through the admin UI, only to replace it (`image=image_url if image_url is not None else product.image`).

### `settings` table and two `Product` columns are dead
The `Setting` model is referenced by nothing outside `models.py`. `Product.is_ramadan` and `Product.is_seasonal` appear in no form, template, service, route, or test.

## Inconsistencies to work around

### Error JSON uses two different keys
`/api/*` emits `{"ok": false, "error": …}`. `/admin/*` emits `{"ok": false, "message": …}`. Don't write one shared client assuming a single key.

### Cart and Favorite providers are mounted twice
`main.jsx` wraps `<App/>` in `CartProvider` + `FavoriteProvider`, and `App.jsx` wraps again. Consumers resolve to the nearest, so the inner pair wins and the outer pair is unreachable dead state that still allocates and re-reads `localStorage`. Delete the outer two.

### `mapProduct` is applied inconsistently
`/menu` and `/favorite` map products; **Home and Order use raw backend shapes**. That's why those pages can't show Arabic names. `ProductCard` defensively reads both `nameAr` and `name_ar`.

### `sort_order` has two numbering bases
Creation assigns `max + 1` (starts at 1); `reorder` assigns `enumerate` indices (starts at 0). After the first drag-reorder the base shifts. Cosmetic — every read sorts with a stable tiebreak — but `reorder` also **silently skips ids that don't resolve**, leaving gaps.

### Delete confirmation is asymmetric
Products, categories, and subscription plans go through the confirm modal. **Slideshow and catering images delete immediately with no confirmation** (they use `delete_submit_button` with a `formaction`, bypassing the modal).

### Status validation lives in two different places
`set_category_status` validates in the route and hand-builds a 400. `set_product_status` does no route check and lets the model raise into the blueprint handler. Same UX, two code paths.

### Client and server disagree on a price of 0
`product_form.js` enforces `priceSingleCents >= 1`; the server's `ProductForm` uses `NumberRange(min=0)` and a test asserts 0 is valid. A free item can be created by POST but not through the form UI.

### Routes call private service methods
`ProductService._get_or_raise`, `CategoryService._get_or_raise`, and the media/subscription equivalents are all invoked from route modules. The naming says private; the usage says public.

## Fragile / easy to break

### `header.header-js` is load-bearing
Despite looking like dead legacy naming, it is the Menu page's `createPortal` target for the category tabs **and** the `--header-height` measurement target. The wider family of `-js` class names (`side-bar-js`, `price-js`, `js-cart-quantity`, `portion-container-js`, …) survives from the pre-React vanilla build — most are now just CSS hooks, but don't strip them blindly.

Also note `Menu.jsx` reads `document.querySelector('header.header-js')` **during render**, not in an effect. It works only because `Navbar` mounts first.

### Do not delete migration `f2c7f0a4b123`
A deliberate no-op placeholder standing in for a revision that was applied to at least one database and then lost from the repo. Deleting it breaks Alembic for any DB whose `alembic_version` references it. Its original schema change is unrecoverable from this repo. (Revision `7f3a2c9e2b1d`'s docstring still names the pre-splice parent — the `down_revision` code is correct, the docstring is stale.)

### Tests never run the migrations
The suite builds its schema with `create_all()` on SQLite. Migrations 8, 10, and 11 use Postgres-only raw SQL with quoted camelCase identifiers. A broken revision would not be caught by `pytest`.

### CSRF is disabled in tests
`TestingConfig` sets `WTF_CSRF_ENABLED = False`, so no test proves CSRF protection actually works on any admin POST.

### `.overflow-x-auto` is globally overridden on the frontend
`index.css` hides scrollbars for that class name — which is a **Tailwind utility name**, so every `overflow-x-auto` in the app silently loses its scrollbar.

### `CORS_ALLOW_ORIGINS` is read at import time
It's evaluated in the class body of `app/config.py`. `run.py` calls `load_dotenv()` first so `.env` works, but any other entrypoint that imports `app.config` before loading the environment gets an empty list and silent CORS failures.

## Behavior that looks like a bug but may be intentional

Confirm these with the owner rather than "fixing" them:

- **No week wraparound in `isProductAvailable`.** On Friday, Monday's and Tuesday's dishes disappear entirely rather than rolling to next week. The comparison is index-based within a Sunday-anchored week.
- **The 5pm cutoff uses the browser's local clock and timezone**, not the server's — a customer abroad sees a different cutoff than Beirut. It's also a pure render-time function with no timer, so a page left open across 17:00 doesn't re-hide the item.
- **The day-conflict modal offers only "Close."** No "replace basket", no "clear and add". The user's only recourse is to manually empty the basket on `/order`.
- **`getProductPrice(product, 'family')` falls back to the single price** when there's no family variant, silently pricing a family order as single.
- **Errors are rendered as empty states** on nearly every frontend page — `catch` blocks set the collection to `[]`, so a down API is indistinguishable from an empty catalogue. `Subscription.jsx` is the only page with a distinct error state.
- **`ImageService.upload` reports S3 outages as `ValidationError`** (a 400), so infrastructure failures surface to admins as "invalid input". Its docstring's `RuntimeError` claim is dead text.

## Documentation that is wrong

- `subscription_form.html` tells the user *"If a plan with the same type and days already exists, it will be updated."* — **false.** `SubscriptionService.create` raises `ConflictError`; a test confirms it.
- `frontend/README.md` is the **unmodified Vite starter template** and documents nothing about this project.
- `ImageService.upload`'s docstring claims it raises `RuntimeError`. It never does.
- `AdminService.create`'s inline comments say `ValueError`; the model raises `ValidationError`.

## Security notes

Not urgent for a small business admin behind a proxy, but worth knowing:

- `logout` is a **GET**, so it is CSRF-unprotected.
- `SESSION_COOKIE_SECURE`, `HTTPONLY`, `SAMESITE`, and `PERMANENT_SESSION_LIFETIME` are never configured — Flask defaults apply, and the app depends entirely on the reverse proxy for TLS.
- `REMEMBER_COOKIE_DURATION` is set but never exercised (`login_user()` is called without `remember=True`), so sessions are browser-session cookies.
- `showToast` builds its markup with `innerHTML`. Every current caller passes a hardcoded literal — keep it that way.
- There is no password policy and **no route to change a password** — only the CLI creates admins.
- The two JSON `set-status` endpoints receive an HTML 302 redirect when the session expires, and the admin JS does not handle that case.
- `products.js` has no guard for a missing `data-product-id` (`categories.js` does), so a malformed row would POST to `/admin/products/undefined/set-status`.
- `.button-*` classes on the frontend set `:focus { outline: none }` with no `:focus-visible` replacement — keyboard focus is invisible on primary buttons.
