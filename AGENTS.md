# Nisrine's Catering — Agent Guide

Two-part monorepo for a Lebanese home-catering business in Bchamoun, Beirut.

- **`backend/`** — Flask 3 + SQLAlchemy + Postgres. Serves a server-rendered admin at `/admin` and a **read-only** JSON API at `/api`. Deployed via docker-compose to a VPS.
- **`frontend/`** — React 19 + Vite 8 + Tailwind v4 SPA. Deployed to Vercel, separately from the backend.

Images live in S3. There is no route at `/` in Flask — the SPA is hosted elsewhere.

## Documentation

Written for agents picking this codebase up cold. Read **[docs/GOTCHAS.md](docs/GOTCHAS.md) before writing any code.**

| Doc | When you need it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Start here — topology, layering, domain model, the three business lines |
| [docs/GOTCHAS.md](docs/GOTCHAS.md) | Traps, inconsistencies, dead code, things that look like bugs but aren't |
| [docs/API.md](docs/API.md) | The contract between the two halves |
| [docs/BACKEND.md](docs/BACKEND.md) | App factory, config/env vars, models, services, migrations, S3, auth |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Routing, contexts, the ordering flow, the day-conflict rule, styling |
| [docs/ADMIN-UI.md](docs/ADMIN-UI.md) | Jinja templates, macros, admin JS, the CSS layer system |
| [docs/TESTING-DEPLOYMENT.md](docs/TESTING-DEPLOYMENT.md) | Fixtures, coverage gaps, deploy checklist |

`backend/README.md` predates these and covers similar backend ground.

## Commands

```bash
# Backend — from backend/, with a venv active
pip install -r requirements.txt
flask db upgrade                  # needs FLASK_APP=run.py and DATABASE_URL
flask create-admin                # the ONLY way to create a login
python run.py                     # dev server; FLASK_ENV=development for CORS defaults
pytest                            # MUST run from backend/ — no pytest.ini anywhere

# Frontend — from frontend/
npm install
npm run dev                       # Vite on :5173
npm run build
npm run lint

# Deploy (backend only; frontend goes out via Vercel)
./deploy.sh                       # git pull master + rebuild the api container
```

There is **no test runner, no TypeScript, and no formatter on the frontend.**

## Conventions

**Backend layering is strict — keep it that way.**
- Routes are thin: no DB queries, no commits. Parse the request, call a service, flash, redirect.
- Services own transactions and DB-dependent rules (uniqueness, existence). Each mutation commits itself with rollback-and-reraise.
- Models own field-level validation via `set_*` mutators that raise `ValidationError`.

**Other things to match:**
- Raise `ValidationError` / `ConflictError` / `NotFoundError` from `app/exceptions.py` — blueprint handlers map them to 400/409/404.
- Admin JS is plain browser ES2020+, no modules or bundler. JS hooks are **data attributes** (`data-sortable`, `data-confirm-form`), not classes.
- Admin CSS uses `@layer` (declared in `main.css`) and loose BEM. Don't reach for `!important` — the layer order handles precedence.
- Frontend styling is Tailwind v4 with **no config file** — tokens are `@theme` in `src/index.css`, mirrored as plain custom properties on `:root`.
- Commit messages follow `type: description` (`feat:`, `fix:`, `refactor:`, `chore:`).

## Non-obvious facts

These will save you from a wrong assumption. Full detail in [docs/GOTCHAS.md](docs/GOTCHAS.md).

1. **Product prices are integer cents. Subscription prices are whole dollars.** Two different units in the same app.
2. **Checkout is not implemented.** The cart works and persists to `localStorage`, but `/order`'s inputs are `readOnly`, the submit button has no handler, and a "Coming soon" overlay covers the page. There is no order table and no write endpoint. Orders happen over WhatsApp/phone/email.
3. **The public API is read-only** — five `GET` endpoints, nothing else.
4. **RTL is not implemented.** The Arabic toggle swaps product names only; every other string is hardcoded English and the layout stays LTR.
5. **Nothing deletes from S3.** Keys are content-addressed and shared across rows, so cleanup must be reference-counted.
6. **Do not delete migration `f2c7f0a4b123`** — it's a deliberate no-op placeholder for a lost revision that deployed databases still reference.
7. **A fresh deploy can't log into `/admin`** until someone runs `flask create-admin` by hand.
8. **Category slugs are the public API's category key** — renaming a category changes every one of its products' `category` value.
9. **`header.header-js`** looks like dead legacy naming but is the Menu page's portal target and the header-height measurement hook.
10. **Tests never run the migrations** — the suite builds its schema with `create_all()` on SQLite, while several revisions use Postgres-only raw SQL.
