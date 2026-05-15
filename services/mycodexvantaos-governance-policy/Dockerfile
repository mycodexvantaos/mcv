FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]

# OCI image ref (Sec.7.3): <registry>/mycodexvantaos/mycodexvantaos-governance-policy:<semver-tag>
# Production digest pinning: <registry>/mycodexvantaos/mycodexvantaos-governance-policy@sha256:<digest>
