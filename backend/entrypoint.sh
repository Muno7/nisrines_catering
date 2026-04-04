#!/bin/sh
set -e

# Docker starts both containers almost simultaneously. This wait ensures
# Postgres is actually accepting connections before we run migrations.
echo "[entrypoint] Waiting for database..."
python3 -c "
import time, os, psycopg2

for i in range(30):
    try:
        psycopg2.connect(host='db', port=5432,
            user=os.environ['POSTGRES_USER'],
            password=os.environ['POSTGRES_PASSWORD'],
            dbname=os.environ['POSTGRES_DB'])
        print('[entrypoint] Database is ready.')
        break
    except psycopg2.OperationalError:
        print(f'[entrypoint] Not ready yet, retrying ({i+1}/30)...')
        time.sleep(2)
else:
    raise SystemExit('[entrypoint] Database not ready after 60s, aborting.')
"

echo "[entrypoint] Running migrations..."
flask db upgrade

echo "[entrypoint] Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 run:app --workers 1 --threads 2 --timeout 120