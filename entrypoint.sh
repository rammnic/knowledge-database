#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy || {
    echo "Migration failed, attempting to resolve..."
    
    # Get list of failed migrations
    FAILED_MIGRATIONS=$(npx prisma migrate status --error --json 2>/dev/null | grep -o '"migrationName":"[^"]*"' | cut -d'"' -f4 || true)
    
    if [ -n "$FAILED_MIGRATIONS" ]; then
        echo "Found failed migrations: $FAILED_MIGRATIONS"
        
        # Mark each failed migration as applied
        for migration in $FAILED_MIGRATIONS; do
            echo "Marking migration as applied: $migration"
            npx prisma migrate resolve --applied "$migration" || true
        done
    fi
    
    # Retry migrations after resolving
    echo "Retrying migrations..."
    npx prisma migrate deploy
}

echo "Starting application..."
exec node server.js
