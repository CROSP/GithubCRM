# Backend Dockerfile - Fixed for bcrypt and native modules
FROM node:20-alpine AS builder

# Install necessary packages for building native modules
RUN apk add --no-cache libc6-compat openssl curl python3 make g++ linux-headers

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install pnpm globally
RUN npm install -g pnpm@10.15.0
ENV PNPM_UNSAFE_PERM=true

# Install ALL dependencies including devDependencies (needed for building)
RUN pnpm install

# Copy source code and configuration files
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# Compile the seed script to JavaScript for production
RUN npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target es2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck || echo "No seed file to compile"

# Production stage
FROM node:20-alpine AS production

# Install necessary packages for runtime and building native modules
RUN apk add --no-cache libc6-compat openssl curl dumb-init python3 make g++

# Create app user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.15.0

# Copy package files
COPY --chown=nestjs:nodejs package*.json ./

# Copy Prisma schema first
COPY --chown=nestjs:nodejs prisma ./prisma/

# Install production dependencies - let husky fail but continue
RUN pnpm install --prod --dangerously-allow-all-builds || true

# Install again with ignore-scripts to complete the installation
RUN pnpm install --prod --ignore-scripts

# Generate Prisma client in production stage
RUN pnpm prisma generate

# Copy built application
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Create necessary directories including i18n locales
RUN mkdir -p /app/uploads /app/logs /app/src/infrastructure/i18n/locales && \
    chown -R nestjs:nodejs /app

# Create startup script
COPY --chown=nestjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "🚀 Starting GitHub CRM Backend..."

# Function to check database connection
check_db_connection() {
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for database connection..."
    while [ $attempt -le $max_attempts ]; do
        if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
            echo "✅ Database connected!"
            return 0
        fi

        echo "💤 Attempt $attempt/$max_attempts - Database not ready, waiting 2 seconds..."
        sleep 2
        ((attempt++))
    done

    echo "❌ Failed to connect to database after $max_attempts attempts"
    exit 1
}

# Check database connection
check_db_connection

# Run Prisma migrations - use db push instead for production
echo "🔄 Setting up database schema..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema updated successfully!"
else
    echo "⚠️ Database schema update failed, but continuing..."
fi

# Seed the database using compiled JavaScript
echo "🌱 Seeding database..."
if [ -f "dist/prisma/seed.js" ]; then
    if node dist/prisma/seed.js; then
        echo "✅ Database seeded successfully!"
    else
        echo "⚠️ Seeding failed, but continuing..."
    fi
else
    echo "ℹ️ No compiled seed file found, skipping..."
fi

echo "🎉 Database setup completed!"

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/src/main.js
EOF

# Make the startup script executable
RUN chmod +x /app/start.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || curl -f http://localhost:3000 || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application using the startup script
CMD ["/app/start.sh"]