FROM node:22-alpine AS base
# openssl is required by the Prisma query engine at generation time (builder)
# and at runtime (runner). Alpine ships OpenSSL 3.x; Prisma binaryTargets must match.
RUN apk add --no-cache openssl
RUN corepack enable

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN yarn install --immutable

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace @greenquote/shared build
RUN yarn workspace @greenquote/web prisma generate
RUN yarn workspace @greenquote/web build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Static assets & standalone server bundle
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Prisma schema, migration files, and seed script (needed at startup)
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

# Prisma query engine — hoisted to root node_modules in a Yarn workspace monorepo
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prisma CLI + migration engine (needed to run `prisma migrate deploy` on startup)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Startup entrypoint: runs migrations then starts the Next.js server
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
