#!/bin/sh
set -e

echo "Checking database migrations..."

# Mark init migration as applied for existing databases
# This handles the case where database was created before migrations were properly set up
echo "Marking init migration as applied (if needed)..."
npx prisma migrate resolve --applied 20260307000000_init --schema /app/prisma/schema.prisma 2>/dev/null || true

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node server.js