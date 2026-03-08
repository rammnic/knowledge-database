# Stage 1: Install dependencies
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build the application
FROM node:25-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set DATABASE_URL for build time
ENV DATABASE_URL="postgresql://user:password@localhost:5432/knowledge"

RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:25-alpine AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Note: public folder is already included in standalone output by Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install all node_modules
COPY --from=builder /app/node_modules/ ./node_modules/

# Create entrypoint script for database migrations
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
echo "Checking database migrations..."\n\
\n\
# Mark init migration as applied for existing databases\n# This handles the case where database was created before migrations were properly set up\n\
echo "Marking init migration as applied (if needed)..."\n\
npx prisma migrate resolve --applied 20260307000000_init --schema /app/prisma/schema.prisma 2>/dev/null || true\n\
\n\
echo "Running database migrations..."\n\
npx prisma migrate deploy\n\
\n\
echo "Starting application..."\n\
exec node server.js' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose the port
EXPOSE 3000

# Environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check using curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

# Start the application with entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]