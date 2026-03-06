#!/bin/bash
set -e

echo "Starting backend..."

# # wait for Postgres to be ready
# until pg_isready -h "$POSTGRES_HOST" -p 5432; do
#   echo "Waiting for Postgres..."
#   sleep 2
# done

# run migrations
alembic upgrade head

# start FastAPI
exec uvicorn main:app --host 0.0.0.0 --port 8000