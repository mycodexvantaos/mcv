# syntax=docker/dockerfile:1.7
# Dockerfile for MyCodeXvantaOS — api-node self-hosted runtime
# Target: apps/api-node (Node.js API server for Docker / Kubernetes deployment)
# Build context: repository root (pnpm monorepo)

# ── Stage 1: base ──────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# ── Stage 2: install dependencies ─────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services ./services
COPY providers ./providers
COPY apps ./apps
COPY contracts ./contracts
COPY modules ./modules
RUN pnpm install --frozen-lockfile

# ── Stage 3: build ─────────────────────────────────────────────
FROM deps AS build
RUN pnpm run build:packages
RUN pnpm run build:modules
RUN pnpm --filter @mycodexvantaos/api-node run build

# ── Stage 4: production runtime ────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built packages, services, providers, contracts, modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services ./services
COPY --from=build /app/providers ./providers
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/modules ./modules

# Copy api-node application
COPY --from=build /app/apps/api-node ./apps/api-node

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Expose the API port
EXPOSE 9100

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 9100, path: '/v1/services', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the api-node server
CMD ["pnpm", "--filter", "@mycodexvantaos/api-node", "start"]
