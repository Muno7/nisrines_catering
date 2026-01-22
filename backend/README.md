# Nisrine's Catering Flask Backend (MVP)

Flask-based admin + API for products with S3 image uploads. This folder is separate from the frontend; run all commands from within `backend/`.

## Requirements
- Python 3.10+
- PostgreSQL (local `DATABASE_URL`)
- AWS S3 bucket with public read (or presigned alternative)

## Setup
1. (From repo root) `cd backend`.
2. Create/activate venv.
3. `pip install -r requirements.txt`
4. Set environment variables (e.g. in `.env`):
```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=replace-me
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/nisrine_catering
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
S3_PUBLIC_BASE_URL=https://your-bucket.s3.amazonaws.com
```

## Database
```
flask db init
flask db migrate -m "init"
flask db upgrade
```

### New tables/columns for categories & menu toggles
1) Create `categories` and `settings` tables plus new product columns:
   - `category_id` (nullable for migration), `status`, `is_ramadan`, `is_seasonal`, ensure `updated_at` is onupdate.
2) Data migration: for each distinct `products.category`, create a Category row with `slug` (use `slugify` logic) and set `products.category_id` to the new id. Keep the legacy `category` string populated for backward compatibility.
3) Apply with Alembic (preferred) or raw SQL; then run `flask db upgrade`.


## Create admin user
```
flask create-admin --username admin --password secret
```

## Run server
```
flask run
```
Visit `/admin/login`.

## API
- `GET /api/products` -> `[{"id": "...", "name": "...", "priceCents": 0, "image": "url", "category": "slug", "ingridients": "text"}]`

## S3 notes
- Bucket must allow `PutObject` and public read for uploaded keys (or configure presigned URLs).
- Keys stored as `products/<uuid>.<ext>` with `ACL=public-read`.
- 5MB upload limit enforced via `MAX_CONTENT_LENGTH`.
