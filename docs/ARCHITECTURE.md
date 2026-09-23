# Architecture

Nisrine's Catering is a Lebanese home-catering business in Bchamoun, Beirut. This repo is a two-part monorepo: a Flask backend that owns the data and the staff-facing admin, and a React SPA that customers browse.

## Topology

```
                    ┌───────────────────────────────────────────┐
  Customer  ───────▶│  Vercel — React SPA (frontend/)            │
                    │  nisrinecatering.com                       │
                    └───────────────┬───────────────────────────┘
                                    │ GET /api/*  (CORS-gated, read-only)
                                    ▼
                    ┌───────────────────────────────────────────┐
  Staff  ──────────▶│  VPS host                                 │
  /admin            │  ┌─────────────────────────────────────┐  │
                    │  │ reverse proxy (NOT in this repo)    │  │
                    │  └──────────────┬──────────────────────┘  │
                    │                 │ 127.0.0.1:8000          │
                    │  ┌──────────────▼──────────────────────┐  │
                    │  │ docker compose                      │  │
                    │  │   api  → gunicorn → Flask           │  │
                    │  │           /admin  (Jinja, session)  │  │
                    │  │           /api    (JSON, anonymous) │  │
                    │  │   db   → postgres:16  (no host port)│  │
                    │  └──────────────┬──────────────────────┘  │
                    └─────────────────┼─────────────────────────┘
                                      │ boto3
                                      ▼
                              ┌──────────────┐
                              │  AWS S3      │  product/slideshow/catering images
                              └──────────────┘
```

The two halves deploy **independently**: `deploy.sh` rebuilds only the backend container; the frontend goes out through Vercel's own Git integration and is absent from `docker-compose.yml` entirely.

## The two request paths

**Public (`/api/*`)** — anonymous, read-only, five `GET` endpoints, JSON envelope `{ok, data}`. CORS is hand-rolled and gates on an allow-list env var. Consumed only by the React app. See [API.md](API.md).

**Admin (`/admin/*`)** — session auth via Flask-Login, server-rendered Jinja, POST-redirect-flash. CSRF is on app-wide. Two endpoints break the pattern and return JSON for AJAX status toggles. See [ADMIN-UI.md](ADMIN-UI.md).

There is **no route at `/`** in the Flask app — the SPA is served separately, and `/admin/login` redirects to `/admin/products` as the de facto dashboard.

## Layering (backend)

```
routes/   → thin. No DB queries, no commits. Parse request, call a service, flash, redirect.
services/ → stateless @staticmethod classes. Own DB-dependent rules (uniqueness, existence)
            and transactions. Every mutation is its own commit, with rollback-and-reraise.
models.py → own field-level validation via set_* mutators that raise ValidationError.
```

The split is held consistently: no route contains a query, and no route commits. The one wrinkle is that routes call underscore-prefixed service methods (`ProductService._get_or_raise` and friends) — the naming says private, the usage says public.

## Domain model

One relationship in the entire schema:

```
categories ──1:N── products      (products.category_id, NOT NULL, backref "category_rel")
                                  cascade="save-update" only — deleting a category never
                                  deletes products; the service blocks the delete instead

admins              (login only)          ─┐
slideshow_images    (homepage carousel)    │
catering_menu_images(catering gallery)     ├─ islands, no FKs
subscription_plans  (price table)          │
settings            (UNUSED — dead table) ─┘
```

There are **no soft deletes anywhere**. Visibility is controlled by flags instead: `Product.status` (`active`/`inactive`) and `Category.active`. The public product list requires **both** gates — an active product in an active category.

## The three business lines

Only one of them touches a cart:

| | Regular menu | Subscription | Catering |
|---|---|---|---|
| What it is | Individual dishes, single or family-of-4 portions; products may also be sold by the dozen; plat-du-jour items are tied to a weekday | Recurring monthly meal packages priced by days/month | Event catering |
| Data | products + categories | plans (`audience`, `daysPerMonth`, 2 prices) | **just images** — photos/scans of menus |
| Money unit | **integer cents** | **whole dollars** | n/a |
| Cart | yes | no | no |
| How you order | blocked — see below | phone / email / WhatsApp link | contact links only |

## Current state: browsing works, ordering does not

The frontend cart is fully functional and persists to `localStorage`, but **there is no submission path**. Every field on `/order` is `readOnly`, the "Place Order" button has no handler, and a "Coming soon" overlay covers the page. The backend has no order table and no write endpoint to match.

Orders today happen over WhatsApp, phone, and email. Wiring checkout is the obvious next feature and needs work on both sides.

## Images

Uploads go through `ImageService.upload` → `s3.upload_file`, which is **content-addressed**: the key is `products/{sha256}.{ext}`, so identical bytes deduplicate via a `head_object` check and are never re-uploaded. Only the resulting public URL is stored in the DB.

Two consequences to hold onto:
- The `products/` prefix is shared by **all three** upload types (products, slideshow, catering).
- **Nothing ever deletes from S3.** Deleting a row orphans its object. Any future cleanup must be reference-counted, since dedup means several rows can point at the same key.

Admin uploads are compressed client-side before they leave the browser (see [ADMIN-UI.md](ADMIN-UI.md#image-compression)).

## Reading order for a new agent

1. This file
2. [GOTCHAS.md](GOTCHAS.md) — the traps, read before writing any code
3. [API.md](API.md) — the contract between the halves
4. [BACKEND.md](BACKEND.md) / [FRONTEND.md](FRONTEND.md) — whichever half you're touching
5. [ADMIN-UI.md](ADMIN-UI.md) — only if touching Jinja/admin JS/CSS
6. [TESTING-DEPLOYMENT.md](TESTING-DEPLOYMENT.md) — before running tests or deploying
