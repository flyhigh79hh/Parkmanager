FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./

# Optimization flags:
# 1. Increase maxsockets for parallel downloads (was 1, now 50)
# 2. Configure fetch retries with reasonable timeouts
# 3. Skip postinstall scripts (Prisma engine download happens during generate)
# 4. Disable audit/fund to reduce network calls
# Note: DNS is configured in docker-compose.yml
RUN npm config set maxsockets 50 && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install --no-audit --no-fund --network-timeout=60000 --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (This will now download the engine)
RUN npx prisma generate

# Next.js telemetry is disabled
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOME=/app
ENV npm_config_cache=/tmp/.npm

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install prisma CLI globally in runner to avoid npx download at runtime
RUN npm install -g prisma@5.22.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 --home /app nextjs

# Fix Prisma cache permissions because root downloaded it to HOME=/app
# And give permissions to global prisma install so it can copy the engine at runtime
RUN chown -R nextjs:nodejs /app/.cache /usr/local/lib/node_modules/prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy prisma schema
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create directory for sqlite database and set permissions
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db
RUN touch /app/db/dev.db && chown nextjs:nodejs /app/db/dev.db

# Set default DATABASE_URL for runtime
ENV DATABASE_URL=file:/app/db/dev.db

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Use prisma directly instead of npx to avoid home/cache issues, and specify schema path
CMD prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate && node server.js
