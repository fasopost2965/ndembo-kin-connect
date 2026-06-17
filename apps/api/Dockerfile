# Multi-stage build for the Ndembo Kin Connect API (Fastify + Prisma).
# Build context MUST be the repo root (pnpm workspace needs packages/types).
# On Railway: set the service Root Directory to the repository root and
# point the config at apps/api/railway.toml.

# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

# Install workspace deps (lockfile gives reproducible installs).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Build shared types, generate the Prisma client, compile the API.
COPY packages/types packages/types
COPY apps/api apps/api
RUN pnpm --filter @nkc/types build \
 && pnpm --filter @nkc/api exec prisma generate \
 && pnpm --filter @nkc/api build

# ── Runtime stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

# Copy the fully-installed & built workspace (preserves pnpm symlinks +
# the generated Prisma client). The Prisma CLI ships with the deps so
# `migrate deploy` can run at startup.
COPY --from=build /app /app

WORKDIR /app/apps/api
EXPOSE 3001

# Apply pending migrations, then start the server.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
