# Dockerfile for mycodexvantaos-app-dev-studio
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20.11.1-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application (if applicable)
RUN if [ -f "tsconfig.json" ]; then \
        npm install -g typescript@5.9.3 && \
        npm run build; \
    fi

# Stage 2: Production
FROM node:20.11.1-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init=1.2.5-r1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Copy config directory
COPY --chown=nodejs:nodejs config ./config

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
