# Dockerfile for ci-repair-agent
# Multi-stage build for optimized production image

# Stage 1: Build
FROM python:3.11-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy workspace root config
COPY python/pyproject.toml python/uv.lock* ./

# Copy the ci-repair library package
COPY python/packages/mycodexvantaos-ci-repair ./packages/mycodexvantaos-ci-repair

# Copy the ci-repair-agent app
COPY python/apps/ci-repair-agent ./apps/ci-repair-agent

# Install dependencies into a virtual environment
RUN uv venv /app/.venv && \
    uv pip install --python /app/.venv/bin/python \
        ./packages/mycodexvantaos-ci-repair \
        ./apps/ci-repair-agent

# Stage 2: Production
FROM python:3.11-slim AS production

# Install dumb-init for proper signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 ci-repair && \
    useradd -u 1001 -g ci-repair -s /bin/bash -m ci-repair

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder --chown=ci-repair:ci-repair /app/.venv /app/.venv

# Copy application code
COPY --chown=ci-repair:ci-repair python/apps/ci-repair-agent/main.py ./main.py
COPY --chown=ci-repair:ci-repair python/packages/mycodexvantaos-ci-repair ./packages/mycodexvantaos-ci-repair

# Set environment to use venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-root user
USER ci-repair

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
