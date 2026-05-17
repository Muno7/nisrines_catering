# Nisrine's Kitchen Backend

Flask backend for the admin dashboard and public API used by the separate
frontend. It manages menu products, categories, slideshow images, catering menu
images, subscription plans, admin login, database persistence, and S3-backed
image URLs.

Run commands from this `backend/` directory unless noted otherwise.

## Architecture

- `run.py` loads `.env`, selects config from `FLASK_ENV`, and creates the app.
- `app/__init__.py` contains the Flask app factory, extension setup, blueprint
  registration, JSON error handling for `/api/*`, CORS headers, and the
  `create-admin` CLI command.
- `app/config.py` reads environment variables for Flask, SQLAlchemy, CORS, and
  S3 settings.
- `app/models.py` defines SQLAlchemy models for admins, products, categories,
  slideshow images, catering menu images, subscription plans, and settings.
- `app/services/` contains the database-facing business operations used by
  routes and tests.
- `app/admin/routes/` contains authenticated admin pages and JSON actions.
- `app/public/routes.py` exposes read-only API endpoints under `/api`.
- `app/s3.py` validates image uploads, writes them to S3, and returns public
  asset URLs.
- `migrations/` is the Flask-Migrate/Alembic migration history.
- `tests/` contains pytest coverage for services, admin routes, public API
  routes, and S3 upload behavior.

## Request Flow Diagrams

### Public API GET Flow

```mermaid
sequenceDiagram
    actor Användare
    participant Frontend
    participant Browser as Webbläsare
    participant API as Flask /api
    participant ProductService
    participant DB as Databas

    Användare->>Frontend: Öppnar meny/sida
    Frontend->>Browser: Skickar GET /api/products
    Browser->>API: GET /api/products med Origin-header
    API->>ProductService: list_public()
    ProductService->>DB: Hämta aktiva produkter
    DB-->>ProductService: Produktlista
    ProductService-->>API: Produkter
    API-->>Browser: JSON + CORS headers

    alt Origin är tillåten
        Browser-->>Frontend: Frontend får läsa svaret
        Frontend-->>Användare: Visar produkter
    else Origin är inte tillåten
        Browser-->>Frontend: Blockerar svaret via CORS
        Frontend-->>Användare: Kan inte visa API-data
    end
```

### Admin Create Product Flow

```mermaid
sequenceDiagram
    actor Admin
    participant AdminUI as Admin UI
    participant Server as Flask /admin
    participant Auth as Login + CSRF
    participant Form as ProductForm
    participant Image as ImageService/S3
    participant ProductService
    participant DB as Databas

    Admin->>AdminUI: Fyller i produktformulär
    AdminUI->>Server: POST /admin/products/new
    Server->>Auth: Kontrollera inloggning och CSRF
    Server->>Form: Validera formulär

    alt Formuläret är ogiltigt
        Server-->>AdminUI: Visa formulär med fel
    else Formuläret är giltigt
        alt Bild finns
            Server->>Image: Ladda upp bild
            Image-->>Server: Bild-URL
        end

        Server->>ProductService: create(...)
        ProductService->>DB: Skapa produkt och commit

        alt Produkten sparas
            DB-->>ProductService: Commit OK
            ProductService-->>Server: Ny produkt
            Server-->>AdminUI: Redirect till produktlista
        else Valideringsfel eller databasfel
            ProductService-->>Server: Fel
            Server-->>AdminUI: Visa felmeddelande
        end
    end
```

## Setup

Python 3.10+ is required by the code syntax. The Dockerfile uses Python 3.12.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a local `.env` file with placeholder values like:

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=replace-with-a-local-secret
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/nisrines_kitchen
AWS_ACCESS_KEY_ID=replace-me
AWS_SECRET_ACCESS_KEY=replace-me
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_PUBLIC_BASE_URL=https://cdn.example.com
CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Initialize an existing database schema from the checked-in migrations:

```powershell
flask db upgrade
flask create-admin --username admin --password local-password
flask run
```

Do not run `flask db init` during normal development; the migration folder is
already part of the project.

## Environment Variables

- `FLASK_APP`: Flask entrypoint. Use `run.py`.
- `FLASK_ENV`: selects `development`, `production`, or `testing` config.
- `SECRET_KEY`: signs Flask sessions and CSRF tokens.
- `DATABASE_URL`: SQLAlchemy database URL for local or deployed PostgreSQL.
- `TEST_DATABASE_URL`: optional test database override. Tests default to
  in-memory SQLite.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`: S3 client
  credentials and region.
- `S3_BUCKET_NAME`: bucket used by image uploads.
- `S3_PUBLIC_BASE_URL`: optional CDN/custom asset host used when building stored
  image URLs.
- `CORS_ALLOW_ORIGINS`: comma-separated frontend origins allowed to call
  `/api/*`. Development defaults to Vite localhost origins when this is unset.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: used by `entrypoint.sh`
  when running the Docker setup against a database host named `db`.

Never commit real secrets or production credentials.

## Database

The app uses Flask-SQLAlchemy and Flask-Migrate/Alembic. Important relationships
and rules visible in the code:

- Products optionally reference `categories.id` through `category_id`.
- Categories have a `slug`, `sort_order`, and `active` flag.
- Product publication uses the `status` field (`active` or `inactive`).
- `Product.is_active` remains as a legacy template compatibility property.
- Subscription plans are unique by `audience` and `days_per_month`.
- Product image URLs are nullable so products can exist without an uploaded
  image.

## Public API

All public routes live under `/api` and return JSON with an `ok` flag.

- `GET /api/products`: active public products. Products in inactive categories
  are hidden, while active uncategorized products remain visible.
- `GET /api/categories`: active categories ordered by `sort_order`, then name.
- `GET /api/slideshow`: slideshow images ordered by `sort_order`, then creation
  time.
- `GET /api/catering-menus`: catering menu images ordered by `sort_order`, then
  creation time.
- `GET /api/subscriptions`: subscription plans ordered by audience, then days.

Product responses intentionally preserve two price shapes:

- Single-price products return `priceCents`.
- Products with a positive family price return
  `price: { "single": ..., "family": ... }`.

Coordinate frontend changes before renaming fields, changing the `ok/data`
wrapper, or replacing category slugs with IDs.

## Admin Workflows

- Admin login is handled with Flask-Login under `/admin/login`.
- Create the first admin with `flask create-admin`.
- Product create/edit uses `ProductForm` and `ProductService`.
- Product image replacement is optional during edits; leaving the image field
  blank keeps the existing S3 URL.
- Product duplication helps admins create another product with similar setup,
  such as category, prices, day, ingredients, and image.
- Category deletes are blocked when products still reference the category.
- Inactive categories hide their products from the public API.
- Slideshow and catering menu uploads accept multiple files. Partial upload
  failures keep successful rows and flash the failed filenames.
- Subscription plans are grouped by `person` and `family` in the admin UI.

## Image Uploads

`app/s3.py` validates extension and MIME type, enforces `MAX_FILE_SIZE`, uploads
to S3, and stores the public URL returned by `_object_url()`. Hash-based object
keys deduplicate exact uploads. The same upload helper currently serves product,
slideshow, and catering menu images.

Default limits from `app/config.py`:

- `MAX_CONTENT_LENGTH`: 50 MB per request.
- `MAX_FILE_SIZE`: 15 MB per individual file.

## Deployment

The Dockerfile installs dependencies, copies this backend folder, exposes port
`8000`, and runs `entrypoint.sh`.

`entrypoint.sh` waits for PostgreSQL at host `db`, runs `flask db upgrade`, and
starts Gunicorn with:

```sh
gunicorn --bind 0.0.0.0:8000 run:app --workers 1 --threads 2 --timeout 120
```

If deploying outside Docker, provide the same environment variables, run
migrations before serving traffic, and put a reverse proxy in front of Gunicorn
for TLS and production headers.

## Testing

Run the backend test suite from `backend/`:

```powershell
pytest
```

The tests use `TestingConfig`, disable CSRF, create a fresh database per test,
and mock S3 where network access would otherwise be required. Coverage includes
service validation, admin route behavior, public API response contracts, CORS,
and S3 upload edge cases.

## Maintenance Notes

- Keep `priceSingleCents` and `priceFamilyCents` database field names stable
  unless migrations, admin forms, tests, and frontend contracts are coordinated.
- Keep the public product price response shapes stable unless the frontend is
  released with matching changes.
- Keep category slugs stable for public API filtering/grouping behavior.
- Do not delete the placeholder Alembic revision unless every deployed database
  history is known not to reference it.
- Generic login failures are intentional so invalid usernames and wrong
  passwords receive the same message.
- Stored image URLs are consumed directly by clients, so changing bucket
  prefixes or public URL generation can require data migration.
