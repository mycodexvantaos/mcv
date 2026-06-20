# ---------------------------------------------------------------------------
# Stage 1: Build — install dependencies with uv
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy workspace configuration
COPY python/pyproject.toml python/uv.lock* /app/python/
COPY python/packages/mycodexvantaos-coder-deep /app/python/packages/mycodexvantaos-coder-deep
COPY python/apps/coder-deep-mcp /app/python/apps/coder-deep-mcp

# Install dependencies
WORKDIR /app/python
RUN uv sync --frozen --no-dev --package coder-deep-mcp

# ---------------------------------------------------------------------------
# Stage 2: Runtime — minimal image with installed packages
# ---------------------------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /app/python /app/python

# Set environment variables
ENV PYTHONPATH=/app/python/packages/mycodexvantaos-coder-deep:/app/python/apps/coder-deep-mcp
ENV PYTHONUNBUFFERED=1
ENV PORT=8010
ENV HOST=0.0.0.0

# Expose the service port
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8010/health || exit 1

# Run the server
WORKDIR /app/python/apps/coder-deep-mcp
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8010"]
