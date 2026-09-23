# Testing and Deployment

## Running the tests

```bash
cd backend
pytest
```

**Must be run from `backend/`.** There is no `pytest.ini`, `pyproject.toml`, `setup.cfg`, or `tox.ini` anywhere in the repo — what makes `from app import create_app` resolve is `backend/tests/__init__.py` existing, which puts `backend/` on `sys.path` via pytest's rootdir insertion.

Optionally swap in a real database:

```bash
TEST_DATABASE_URL=postgresql://user:pw@localhost:5432/test pytest
```

Dependencies are `pytest==8.3.5` and `pytest-flask==1.3.0`, though **nothing actually uses a pytest-flask fixture** — `app` and `client` are hand-rolled in `conftest.py`.

## How the fixtures work

[backend/tests/conftest.py](../backend/tests/conftest.py):

- **`app`** is **session-scoped** — `create_app(TestingConfig)` once for the whole run. `TestingConfig` disables CSRF, hard-codes a secret, and uses `TEST_DATABASE_URL` or `sqlite:///:memory:`.
- **`db`** is **function-scoped and `autouse=True`** — pushes an app context, `create_all()`, yields, then `session.remove()` + `drop_all()`. Every test gets a fresh schema inside an app context. This works with a session-scoped app on `:memory:` because Flask-SQLAlchemy 3.1 uses a `StaticPool` there, so all sessions share one connection.
- **`logged_in_client`** POSTs `/admin/login` with `admin` / `password123` and returns the client with its session cookie. CSRF is off, so no token is needed.
- **Factories** (`make_category`, `make_product`, `make_subscription_plan`, `make_slide`, `make_catering_menu`) all delegate to the **service layer**, so they exercise real validation rather than inserting rows directly.
- **Form-payload builders** (`product_form_data`, `subscription_form_data`) return dicts for `client.post(data=…)`.

There is no shared S3 mock — tests patch `app.services.ImageService.upload` inline, except `test_s3_upload.py`, which has its own autouse `s3_config` fixture and a hand-rolled `FakeS3Client`.

> **The schema under test comes from `create_all()`, not Alembic.** The migrations in `backend/migrations/` are never exercised by the suite. A revision that fails to apply would not be caught, and the Postgres-only raw SQL in revisions 8/10/11 is never run.

## Coverage

| File | Covers |
|---|---|
| `test_admin_routes.py` (432 lines) | The happy-path route sweep — auth, products, categories, catering, slideshow, subscriptions. S3 always mocked |
| `test_admin_route_edges.py` (322 lines) | The interesting half — zero prices, upload failures aborting creation, partial-failure multi-uploads, missing-id flashes, and **unauthenticated writes asserting no mutation** |
| `test_public_routes.py` (129 lines) | The `/api` contract: visibility gating, the nested price shape, sort orders, the 404/500 JSON bodies, and CORS headers present/absent |
| `test_services.py` (396 lines) | Service-layer units, no HTTP — every validation and conflict path |
| `test_service_queries.py` (382 lines) | Query behavior — `list_filtered` combinations, Arabic search (`q="شوربة"`), `bulk_update`, `reorder` skipping unknown ids, `to_dict()` shape including `family: 0 → None` |
| `test_s3_upload.py` (145 lines) | `app.s3` in isolation — allow-lists, size cap, missing bucket, the dedupe `head_object` hit, non-404 head errors, upload failure, and the fallback URL shape |

### Gaps worth knowing

**Everything in [ADMIN-UI.md](ADMIN-UI.md) is untested.** No JS test runner, no `package.json` in `backend/`, no DOM tests. The sortable reorder injection, the compression ladder, the confirm modal's focus trap, and the client validation rules have zero automated coverage. The backend README designates accessibility checks as manual.

Server-side:
- **CSRF is disabled in tests**, so nothing proves CSRF protection works on any admin POST.
- Migrations are never run (above).
- The HTML `errors/404.html` / `errors/500.html` branches are never rendered — only the `/api/` JSON branches.
- No test for the `money_cents` filter or the `create-admin` CLI command.
- No route-level test for `missing_image=1`, `save_add_another`, `save_duplicate`, or bulk `category_id`.
- No test for `set_product_status` with a nonexistent id (the category equivalent *is* tested).
- No test for the `"Invalid form submission."` branch in the upload routes, or for `MAX_CONTENT_LENGTH` / 413.
- No test of the login `next`-parameter redirect after a `login_required` bounce.
- `test_login_with_valid_credentials` asserts a disjunction weak enough to pass under several failure modes.

## Deployment

### The pieces

**`docker-compose.yml`** (repo root) — two services, both fed by `./.env.prod`:

- **`db`** — `postgres:16`, volume `pgdata`, `restart: unless-stopped`, **no host port mapping** (reachable only over the Compose network).
- **`api`** — built from `./backend`, `depends_on: [db]`, and `ports: "127.0.0.1:8000:8000"` — *"Only bind API to localhost on the host machine (NOT public)."*

**`backend/Dockerfile`** — `python:3.12-slim`, requirements installed before `COPY . /app` (so dependency-only rebuilds hit the cache), `EXPOSE 8000`, `ENTRYPOINT ["/entrypoint.sh"]`. No `.dockerignore`, so the build context includes `tests/`, `docs/`, and any local `.venv`. No non-root `USER`.

**`backend/entrypoint.sh`** — three phases under `set -e`:

1. **Wait for Postgres** — up to 30 `psycopg2.connect` attempts, 2s apart (~60s), then abort. **Host `db` and port `5432` are hardcoded**, coupling the image to this exact Compose topology.
2. **`flask db upgrade`** — migrations run on every container start. Requires `FLASK_APP` from `.env.prod`.
3. **`exec gunicorn --bind 0.0.0.0:8000 run:app --workers 1 --threads 2 --timeout 120`**

**`deploy.sh`** (repo root):

```bash
cd "$(dirname "$0")"
git pull origin master
docker compose up -d --build --force-recreate api
```

Pulls `master` and rebuilds **only `api`** — `db` is deliberately left alone. Migrations happen implicitly as `api` starts.

### First-deploy checklist

1. Create `.env.prod` at the repo root (gitignored, and **there is no `.env.prod.example`** — the keys must be reconstructed from `config.py` and `entrypoint.sh`):
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `DATABASE_URL`, `SECRET_KEY`, `FLASK_ENV=production`, `FLASK_APP=run.py`
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, optionally `S3_PUBLIC_BASE_URL`
   - `CORS_ALLOW_ORIGINS` — **the frontend's origin must be here or the SPA gets CORS errors**
2. `docker compose up -d --build`
3. **Create the first admin by hand** — nothing does this automatically:
   ```bash
   docker compose exec api flask create-admin
   ```
   Until this runs, `/admin` is unreachable on a fresh database.
4. Configure the host's reverse proxy to front `127.0.0.1:8000` (not in this repo — see below).
5. Set `VITE_API_BASE_URL` in the Vercel project settings to the public backend origin.

### Not covered by this repo

- **No reverse proxy.** No nginx/Caddy/Traefik service, config, or vhost anywhere. Given the `127.0.0.1` bind, one must exist on the host, configured entirely outside version control.
- **No TLS.** No certs, no ACME. And `SESSION_COOKIE_SECURE` / `HTTPONLY` / `SAMESITE` are never set in `config.py` — the app relies entirely on whatever terminates TLS in front of it.
- **No static-asset strategy.** Admin CSS/JS are served by Flask's `/static` handler through gunicorn, unversioned and without cache headers — so a CSS change can be served stale from browser cache.
- **No frontend hosting here.** `frontend/` is absent from both compose and `deploy.sh`; it deploys via Vercel's Git integration.
- **No healthchecks.** `depends_on` has no `condition: service_healthy`; readiness is solved by the entrypoint's retry loop instead.
- **No backups, log shipping, or monitoring.** `pgdata` is a bare named volume with no dump/restore tooling.
- **No CI.** No `.github/`, no pipeline. The test suite never runs automatically, and `deploy.sh` does not run it before rebuilding.
- **No rollback path.** No image tagging, no git pin, no migration-downgrade step.
- **Not zero-downtime.** `--force-recreate` drops the container, then migrations run on the new one. Single gunicorn worker, 2 threads.

### Secrets

`.gitignore` covers `.env`, `.env.prod`, `backend/.env`, and `backend/app/.env`. Verified: the only tracked file matching "env" is `backend/migrations/env.py`. No secrets are committed.
