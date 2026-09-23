# Public API Contract

The React frontend's only backend dependency. Five endpoints, all `GET`, all anonymous, all under `/api`.

Source: [backend/app/public/routes.py](../backend/app/public/routes.py), shapes from `to_dict()` in [backend/app/models.py](../backend/app/models.py).

## Envelope

Every success response:

```json
{ "ok": true, "data": [ ... ] }
```

Every error response from `/api/*`:

```json
{ "ok": false, "error": "message" }
```

> **Inconsistency to know about:** the admin blueprint uses `"message"` instead of `"error"` for the same job. Don't write one shared client that assumes a single key.

## Endpoints

| Method | URL | Returns | Ordering |
|---|---|---|---|
| GET | `/api/products` | Product[] | `updated_at DESC` |
| GET | `/api/categories` | Category[] | `sort_order ASC, name ASC` |
| GET | `/api/slideshow` | Image[] | `sort_order ASC, created_at ASC` |
| GET | `/api/catering-menus` | Image[] | `sort_order ASC, created_at ASC` |
| GET | `/api/subscriptions` | SubscriptionPlan[] | `audience ASC, days_per_month ASC` |

No query params, no path params, no pagination, no filtering, no sorting controls. All filtering happens client-side.

## Shapes

### Product

```json
{
  "id": "uuid4 string",
  "name": "Chicken shawarma",
  "name_ar": "شاورما دجاج",
  "image": "https://cdn.example.com/products/<sha256>.jpg",
  "category": "plat-du-jour",
  "ingredients": "chicken, garlic, pickles",
  "day": "monday",
  "order_unit": "each",
  "status": "active",
  "price": { "single": 850, "family": 1900 }
}
```

- **`price` values are integer cents.** Divide by 100 to display. `formatCurrency()` on the frontend does this.
- `price.family` is `null` when there is no family portion. **A stored `0` also serializes as `null`** — `to_dict` uses a truthiness check, not `is None`.
- `category` is the category **slug**, not its DB id. Renaming a category changes this value on every one of its products.
- `day` is a lowercase English weekday or `null`. Day-less products are always orderable.
- `order_unit` is either `"each"` (the default) or `"dozen"`. A dozen price covers 12 pieces; the frontend displays `/ dozen` and labels basket quantities accordingly.
- `status` is always `"active"` here — the public list filters to active products **in active categories** (both gates must pass).
- Not exposed: `category_id`, `is_ramadan`, `is_seasonal`, `created_at`, `updated_at`.

### Category

```json
{ "id": 1, "name": "Plat du jour", "slug": "plat-du-jour", "sort_order": 0 }
```

Only `active=true` categories are returned; the `active` flag itself is not in the payload.

### Image (slideshow and catering-menus share this shape)

```json
{ "id": "uuid4 string", "image": "https://...", "sort_order": 0 }
```

There is no visibility flag — everything in these tables is public.

### SubscriptionPlan

```json
{
  "id": "uuid4 string",
  "audience": "person",
  "daysPerMonth": 20,
  "platDuJour": 160,
  "withSalad": 190
}
```

- **camelCase keys**, unlike every other endpoint. Column names are `days_per_month`, `price_plat_du_jour`, `price_with_salad`.
- `audience` is `"person"` or `"family"`.
- **These prices are whole dollars, not cents.** This is the sharpest trap in the codebase: product prices are cents, subscription prices are dollars. `Subscription.jsx` correctly prints them raw without `formatCurrency`.

## Status codes

| Situation | Status | Body |
|---|---|---|
| Success | 200 | `{"ok": true, "data": [...]}` |
| `ValidationError` | 400 | `{"ok": false, "error": "..."}` |
| `NotFoundError` / unknown `/api/*` path | 404 | `{"ok": false, "error": "Not found."}` |
| `ConflictError` | 409 | `{"ok": false, "error": "..."}` |
| Unhandled | 500 | `{"ok": false, "error": "An unexpected error occurred."}` |

In practice only 200 and 500 are reachable — these routes take no input.

## CORS

Hand-rolled in `create_app` via an `after_request` hook (no Flask-CORS). Applies only to paths starting with `/api/`, and only when the request `Origin` is listed in the `CORS_ALLOW_ORIGINS` env var (comma-separated).

```
Access-Control-Allow-Origin: <echoed origin>
Vary: Origin
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

No credentials header — the public API is anonymous. `DevelopmentConfig` defaults to `http://localhost:5173` and `http://127.0.0.1:5173` when the env var is empty.

**If the frontend gets a CORS error, the fix is almost always adding its origin to `CORS_ALLOW_ORIGINS` in `.env.prod`.**

## Caching

No server-side cache headers at all. All caching is client-side in [frontend/src/utils/api.js](../frontend/src/utils/api.js): a module-scoped `Map` keyed by path, 10-minute TTL, storing the *promise* (so in-flight requests dedupe automatically), self-evicting on rejection. See [FRONTEND.md](FRONTEND.md#api-layer).

Practical effect: navigating Home → Menu → Order within 10 minutes issues **one** `/api/products` request.

## What does not exist

There is **no write endpoint of any kind** on the public API — no order submission, no contact form, no favorites sync. The cart and favorites live entirely in the browser's `localStorage`. See [FRONTEND.md](FRONTEND.md#the-ordering-flow) for what this means for the checkout flow.
