#!/bin/sh
set -e

echo "Running database migrations..."

# Run migrations and capture output
MIGRATION_OUTPUT=$(npx prisma migrate deploy 2>&1) || true
echo "$MIGRATION_OUTPUT"

# Check if there are failed migrations
if echo "$MIGRATION_OUTPUT" | grep -q "P3009"; then
    echo "Migration failed, attempting to resolve..."

    # Extract migration name from error message like "The `20260308000000_add_enums` migration started at..."
    FAILED_MIGRATION=$(echo "$MIGRATION_OUTPUT" | grep -oP "The\s+\`\K[^\`]+" | head -1 || true)

    if [ -n "$FAILED_MIGRATION" ]; then
        echo "Found failed migration: $FAILED_MIGRATION"
        echo "Marking migration as applied: $FAILED_MIGRATION"
        npx prisma migrate resolve --applied "$FAILED_MIGRATION" || true
    else
        # Fallback: try to get from database
        echo "Could not extract migration name from output, checking database..."
        FAILED_MIGRATION=$(docker exec knowledge-db psql -U knowledge -d knowledge -t -c "SELECT migration_name FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL LIMIT 1;" 2>/dev/null || true)
        FAILED_MIGRATION=$(echo "$FAILED_MIGRATION" | xargs || true)
        
        if [ -n "$FAILED_MIGRATION" ]; then
            echo "Found failed migration in database: $FAILED_MIGRATION"
            echo "Marking migration as applied: $FAILED_MIGRATION"
            npx prisma migrate resolve --applied "$FAILED_MIGRATION" || true
        fi
    fi

    # Retry migrations
    echo "Retrying migrations..."
    npx prisma migrate deploy
fi

echo "Starting application..."
exec node server.js