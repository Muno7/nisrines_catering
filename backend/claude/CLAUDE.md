# Project: Private Kitchen Backend

## What this app does
Backend for a private home kitchen business based in Lebanon. The owner
(admin) manages her menu content through an admin dashboard. Customers visit
a separately deployed frontend (Vercel) that consumes this backend's public
API — they never log in or sign up.

## Architecture
- **Backend**: Flask (this repo) — deployed on AWS
- **Frontend**: Vanilla JS + Tailwind CSS — deployed separately on Vercel
- **Database**: PostgreSQL
- **File storage**: AWS S3 (images for slideshow, catering menu, products)

## Authentication
- Single admin user, pre-created in the database
- Form-based login via flask-login
- Only the admin dashboard routes are protected with `@login_required`
- Public API endpoints are unauthenticated (GET only)

## What the API exposes (public, GET only)
- Products (with price, category, serving size etc.)
- Subscriptions
- Slideshow images
- Catering menu images

## What the admin dashboard manages
- Slideshow images (upload to S3)
- Products (CRUD — name, price, category, description)
- Categories
- Subscriptions
- Catering menu images (upload to S3)

## Folder structure
```
backend/
├── app/
│   ├── api/              ← Public JSON endpoints (GET only)
│   ├── static/
│   ├── templates/        ← Admin dashboard templates
│   ├── config.py
│   ├── extensions.py     ← db, login_manager, s3 client
│   └── ...
├── migrations/
├── tests/                ← Do not touch
├── .env
├── requirements.txt
└── wsgi.py               ← Entry point
```

## How to run
```bash
# Activate virtual environment first
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# Run dev server
flask --app wsgi run --debug

# Migrations
flask --app wsgi db migrate -m "description"
flask --app wsgi db upgrade
```

## Environment variables (in .env)
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — Flask secret key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` — S3 credentials

## Key conventions
- Follow the MVC structure from `flask-mvc-refactor` skill
- Public API routes live in `app/api/` blueprint, prefix `/api`
- Admin dashboard routes are separate blueprint, protected with `@login_required`
- All image uploads go to S3 — never store images locally
- No user registration or public authentication — admin only
- Frontend is fully decoupled — backend never renders frontend pages
