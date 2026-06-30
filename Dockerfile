# syntax=docker/dockerfile:1.7
# Dockerfile for MyCodeXvantaOS — api-node self-hosted runtime
# Target: apps/api-node (Node.js API server for Docker / Kubernetes deployment)
# Build context: repository root (pnpm monorepo)

# ── Stage 1: base ──────────────────────────────────────────────────────────────
FROM node:26-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@9 --activate

# ── Stage 2: install dependencies ─────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services ./services
COPY providers ./providers
COPY apps ./apps
COPY contracts ./contracts
COPY modules ./modules
RUN pnpm install --no-frozen-lockfile

# ── Stage 3: build ─────────────────────────────────────────────────────────────
FROM deps AS build
RUN pnpm --filter @mycodexvantaos/core run build
RUN pnpm --filter @mycodexvantaos/api-node run build

# ── Stage 4: production runtime ───────────────────────────────────────────────
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy the self-contained bundle (all workspace deps are bundled by tsup)
COPY --from=build /app/apps/api-node/dist/index.js ./dist/index.js

# Expose the API port
EXPOSE 9100

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 9100, path: '/v1/services', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the api-node server
CMD ["node", "dist/index.js"]
