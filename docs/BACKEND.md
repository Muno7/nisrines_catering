# Backend

Flask 3 app in [backend/](../backend). Serves a server-rendered admin at `/admin` and a read-only JSON API at `/api`. Postgres in production, in-memory SQLite in tests.

## Layout

```
backend/
  run.py              entrypoint — load_dotenv(), then create_app(config_by_name[FLASK_ENV])
  app/
    __init__.py       app factory, error handlers, CORS, Jinja filters, CLI
    config.py         BaseConfig / Development / Production / Testing
    extensions.py     db, migrate, login_manager, csrf singletons
    models.py         all six models
    exceptions.py     AppError hierarchy
    s3.py             upload_file, allowed_file, content-addressed keys
    services/         business logic, transactions
    admin/            routes/ + forms.py — Jinja pages
    public/           routes.py — the JSON API
    templates/        Jinja (see ADMIN-UI.md)
    static/           admin CSS/JS (see ADMIN-UI.md)
  migrations/         Alembic
  tests/              pytest
```

## App factory

`create_app(config_object)` in [app/__init__.py](../backend/app/__init__.py):

1. `app.config.from_object(config_object)`
2. Init `db`, `migrate`, `login_manager`, `csrf` (CSRF is **app-wide**, including the JSON admin endpoints)
3. Login config: `login_view = "admin.login"`, `login_message_category = "warning"`, and a `user_loader` returning `Admin.query.get(user_id)`
4. Register the `money_cents` Jinja filter — `f"${(value or 0) / 100:.2f}"`
5. Register the CLI (one command, `create-admin`)
6. Blueprints: `admin_bp` at `/admin`, `public_bp` at `/api`
7. Error handlers that content-negotiate by path prefix — JSON for `/api/*`, `errors/404.html` / `errors/500.html` otherwise
8. `after_request` CORS hook, `/api/*` only

### CLI

Exactly one command:

```bash
flask create-admin --username <name> --password <pw>
```

Both prompt if omitted; the password is hidden with confirmation. **Nothing runs this automatically** — a fresh deployment has an empty `admins` table and no way to log into `/admin` until someone runs it by hand:

```bash
docker compose exec api flask create-admin
```

## Configuration

Class-based in [app/config.py](../backend/app/config.py); `config_by_name` maps `development` / `production` / `testing`. `run.py` reads `FLASK_ENV` (default `production`) — an unrecognised value raises `KeyError` at import, it does not fall back.

| Setting | Env var | Default | Controls |
|---|---|---|---|
| `SECRET_KEY` | `SECRET_KEY` | **none** | session signing + CSRF. Unset → breaks at first use |
| `SQLALCHEMY_DATABASE_URI` | `DATABASE_URL` | **none** | e.g. `postgresql+psycopg2://user:pw@db:5432/app` |
| `CORS_ALLOW_ORIGINS` | `CORS_ALLOW_ORIGINS` | `[]` | comma-separated origin allow-list |
| `AWS_ACCESS_KEY_ID` | same | none | boto3 |
| `AWS_SECRET_ACCESS_KEY` | same | none | boto3 |
| `AWS_REGION` | same | none | boto3 + fallback URL host |
| `S3_BUCKET_NAME` | same | none | unset → uploads fail with "S3 bucket not configured." |
| `S3_PUBLIC_BASE_URL` | same | none | optional CDN host for stored URLs |
| `MAX_CONTENT_LENGTH` | — | 50 MB | per-request, Flask-enforced (413) |
| `MAX_FILE_SIZE` | — | 15 MB | per-file, enforced manually in `s3.py` |
| `REMEMBER_COOKIE_DURATION` | — | 7 days | configured but **never exercised** — `login_user()` is called without `remember=True` |

Read outside `config.py`: `FLASK_ENV` (`run.py`); `FLASK_APP` (needed by the `flask db upgrade` in `entrypoint.sh`, **not set in the Dockerfile** — must come from `.env.prod`); `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (the entrypoint's readiness probe, via `os.environ[...]`, so missing ones abort startup).

`DevelopmentConfig` falls back to `http://localhost:5173` + `http://127.0.0.1:5173` for CORS. `TestingConfig` hard-codes a secret, disables CSRF, and uses `TEST_DATABASE_URL` or in-memory SQLite.

> **Ordering gotcha:** `CORS_ALLOW_ORIGINS` is evaluated at class-body execution, i.e. when `app.config` is imported. `run.py` calls `load_dotenv()` first, so `.env` works — but any other entrypoint that imports `app.config` before loading the environment silently gets an empty list.

Not configured at all: `SESSION_COOKIE_SECURE`, `HTTPONLY`, `SAMESITE`, `PERMANENT_SESSION_LIFETIME`. Flask defaults apply. Worth hardening.

## Models

All in [app/models.py](../backend/app/models.py). String PKs are `str(uuid.uuid4())`, timestamps default `datetime.utcnow` — **all Python-side**, no `server_default` anywhere.

### Product — `products`

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | String(36) | no | uuid4 (PK) |
| `name` | String(255) | no | |
| `name_ar` | String(255) | **yes** | |
| `priceSingleCents` | Integer | no | — **camelCase column name, deliberate** |
| `priceFamilyCents` | Integer | **yes** | `NULL` = no family option |
| `image` | Text | **yes** | public S3/CDN URL |
| `category_id` | Integer | no | FK → `categories.id` |
| `ingredients` | Text | no | |
| `day` | String(20) | **yes** | lowercase English weekday |
| `status` | String(20) | no | `"active"` — enum-in-code `active`/`inactive` |
| `is_ramadan` | Boolean | no | `False` — **dead column, never read or written** |
| `is_seasonal` | Boolean | no | `False` — **dead column** |
| `created_at` / `updated_at` | DateTime | no | utcnow / onupdate |

`is_active` survives as a read-only **property** (`status == "active"`) for legacy template compatibility — the column was dropped in migration `d1e2f3a4b5c6`.

### Category — `categories`

`id` (Integer PK), `name` (String(120), unique), `slug` (String(140), unique + indexed), `sort_order` (Integer, 0), `active` (Boolean, True), timestamps.

```python
products = db.relationship("Product", backref="category_rel", lazy=True, cascade="save-update")
```

`cascade="save-update"` deliberately excludes delete — category maintenance must never delete menu items. `CategoryService.delete` refuses while any product references it.

**The slug is derived only inside `Category.set_name` via `slugify(name)`**, so it can never drift. There is no `-2` de-duplication strategy: a colliding name is rejected with `ConflictError`.

### Admin — `admins`

`id`, `username` (String(80), unique), `password_hash` (String(255)), `created_at`. Werkzeug `generate_password_hash` / `check_password_hash`. No password policy, and **no route exists to change a password** — only the CLI creates admins.

### SlideshowImage / CateringMenuImage

Structurally identical: `id` (uuid4 PK), `image` (Text, not null), `sort_order` (Integer, 0), `created_at`. Deliberate duplication so the two media types stay independent.

### SubscriptionPlan — `subscription_plans`

`id` (uuid4 PK), `audience` (String(20) — `person`/`family`), `days_per_month` (Integer), `price_plat_du_jour` (Integer), `price_with_salad` (Integer), timestamps. Unique constraint on `(audience, days_per_month)`.

**These prices are whole dollars, not cents** — unlike products. Form labels say `($)` and templates print them without the `money_cents` filter.

### Setting — `settings`

`key` (String(100), PK — no `id`), `value` (Text, nullable), timestamps. Static `get`/`set` helpers; `set` does **not** commit.

> **This model is entirely unused** — nothing outside `models.py` references it. A forward-looking placeholder. The table is still created by the init migration.

## Services

Stateless classes of `@staticmethod`s, exported from `app/services/__init__.py`. Uniform transaction idiom:

```python
try:
    db.session.commit()
    return ...
except SQLAlchemyError:
    db.session.rollback()
    raise
```

Each service call is its own transaction. The one exception is `CategoryService.ensure`, which flushes without committing — and is currently called from nowhere.

| Service | Notable behavior |
|---|---|
| `AdminService` | `authenticate` raises the same `ValidationError("Invalid credentials.")` for unknown user *and* wrong password — deliberate anti-enumeration |
| `CategoryService` | `create` computes `sort_order = max + 1`; `reorder` assigns 0-based indices (see the numbering note below); `delete` blocks while products remain; `product_counts()` returns `{id: count}` |
| `ProductService` | `list_public()` is the whole visibility rule: active product **and** active category. `duplicate()` reuses the same S3 URL, appends `(copy)`, forces `inactive`. `bulk_update` treats `day == "clear"` as the unset sentinel and returns the count of *matched* products, not changed ones |
| `SlideshowService` / `CateringService` | Byte-for-byte identical apart from model and message text |
| `SubscriptionService` | Conflict check mirrors the DB unique constraint |
| `ImageService` | `upload()` flattens **all** failures — validation *and* genuine S3 outages — into `ValidationError`, so routes can catch uniformly. Its docstring claims `RuntimeError`; that is stale, the code never raises it |

> **`sort_order` numbering is inconsistent by design.** Creation assigns `max + 1` (so sequences start at 1); `reorder` assigns `enumerate` indices (starting at 0). After the first drag-reorder the base shifts. Cosmetic only — every read sorts with a stable tiebreak — but don't be surprised by it. `reorder` also silently skips ids that don't resolve, leaving gaps.

## Exceptions

[app/exceptions.py](../backend/app/exceptions.py):

```python
AppError          status_code = 400   (per-instance override supported)
├── ValidationError  400
├── ConflictError    409
└── NotFoundError    404
```

Mapped to JSON by **blueprint-level** handlers — `/api/*` emits `{"ok": false, "error": …}`, `/admin/*` emits `{"ok": false, "message": …}`. Most admin routes catch these themselves and convert to a flash + redirect, so the admin handler mainly serves the two AJAX endpoints.

> There is **no app-level `AppError` handler** — an `AppError` raised outside either blueprint would become a generic 500.

Field-level validation lives on the models (the `set_*` mutators); services own only the DB-dependent checks. That split is deliberate and documented in the source comments.

## S3

[app/s3.py](../backend/app/s3.py). Allowed extensions: `jpg jpeg png webp gif tiff tif bmp`. MIME must be in the allow-list **or** merely start with `image/` — extension allow-listing is the primary guardrail, since browser MIME values vary.

**Key:** `products/{sha256-of-bytes}.{ext}` — content-addressed. `upload_file` does a `head_object` first; a hit returns the existing URL with no re-upload.

**URL:** `S3_PUBLIC_BASE_URL/{key}` if set, else `https://{bucket}.s3.{region}.amazonaws.com/{key}`. Only the final string is stored.

**No ACL is set** on upload — public readability must come from the bucket policy or CDN.

Returns `(ok: bool, result: str)`. `ImageService.upload` unwraps it and raises `ValidationError(result)` on failure.

> **Nothing deletes from S3.** No `delete_object` call exists anywhere in `app/`. Deleting a product, slide, or menu image removes only the DB row.

On product edit, `image=image_url if image_url is not None else product.image` — so no new file means the existing URL is preserved, and **there is no way to clear a product image through the admin UI**, only to replace it.

Multi-file uploads (slideshow, catering) are **per-file, not transactional** — some can succeed and commit while others fail, producing both a success and a failure flash.

## Migrations

Flask-Migrate/Alembic, linear chain, single head. `env.py` and `alembic.ini` are stock.

| # | Revision | Change |
|---|---|---|
| 1 | `0069ebaefba7` | init — `categories`, `settings`, `slideshow_images`, **`users`**, `products` |
| 2 | `d9a5a4cb73f7` | `products.image` → nullable |
| 3 | `c4a4b4d0a9d7` | add `products.name_ar` |
| 4 | `f2c7f0a4b123` | **no-op placeholder** — see below |
| 5 | `7f3a2c9e2b1d` | create `catering_menu_images` |
| 6 | `84c1f9d2a7b6` | create `subscription_plans` + **seeds 7 plans** via `bulk_insert` |
| 7 | `a1b2c3d4e5f6` | rename `users` → `admins` |
| 8 | `b2c3d4e5f6a7` | drop the redundant `products.category` string column |
| 9 | `c5d6e7f8a9b0` | `priceFamilyCents` → nullable, then `UPDATE … SET NULL WHERE = 0` |
| 10 | `d1e2f3a4b5c6` | backfill `status` from `is_active`, drop `is_active` |
| 11 | `e6f7a8b9c0d1` | **HEAD** — assign orphans to an auto-created `uncategorized` category, then `category_id` NOT NULL |

> ### Do not delete `f2c7f0a4b123`
>
> Both `upgrade()` and `downgrade()` are `pass`. Its own comment: *"This revision exists only to preserve Alembic history for databases that already reference the missing id; do not delete or squash it casually."*
>
> The likely story (inference, not fact): a real revision with that id was written and applied to at least one database, then lost from the repo. Because `alembic_version` in that DB stores `f2c7f0a4b123` and revision 5 chains off it, Alembic would fail with "Can't locate revision" without a file. **What the original revision did is unrecoverable from this repo.**
>
> Note revision 5's docstring still says `Revises: c4a4b4d0a9d7` — stale from before the placeholder was spliced in. The code (`down_revision`) is correct.

Migrations 8, 10, 11 use raw SQL with Postgres-quoted camelCase identifiers (`"priceFamilyCents"`) and `TRUE` / `CURRENT_TIMESTAMP` — **Postgres-only**. Tests build the schema with `create_all()` rather than Alembic, so this is never exercised there.

## Auth

- Flask-Login sessions. Every admin view except `login` carries `@login_required`.
- `logout` is a **GET**, so it is CSRF-unprotected.
- The two JSON `set-status` endpoints receive an HTML 302 redirect when the session has expired — the admin JS does not handle that case.
- `user_loader` uses the legacy `Admin.query.get()` (deprecated in SQLAlchemy 2.x) rather than `db.session.get`, unlike the rest of the codebase.
- `session_protection` is unset (Flask-Login default `"basic"`).
