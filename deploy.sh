#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull origin master

docker compose up -d --build --force-recreate api

# Run migrations if you use them
docker compose exec api flask db upgrade

# Quick health check (adjust endpoint if needed)
curl -fsS http://127.0.0.1:8000/api/products >/dev/null

echo "Deploy complete."