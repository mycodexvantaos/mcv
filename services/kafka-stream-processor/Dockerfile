# Dockerfile for kafka-stream-processor
# Multi-stage build for optimized production image

# Stage 1: Build
FROM python:3.11-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy workspace root config
COPY python/pyproject.toml python/uv.lock* ./

# Copy the stream-pipeline library package
COPY python/packages/mycodexvantaos-stream-pipeline ./packages/mycodexvantaos-stream-pipeline

# Copy the kafka-stream-processor app
COPY python/apps/kafka-stream-processor ./apps/kafka-stream-processor

# Install dependencies into a virtual environment
RUN uv venv /app/.venv && \
    uv pip install --python /app/.venv/bin/python \
        ./packages/mycodexvantaos-stream-pipeline \
        ./apps/kafka-stream-processor

# Stage 2: Production
FROM python:3.11-slim AS production

# Install dumb-init for proper signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 stream-processor && \
    useradd -u 1001 -g stream-processor -s /bin/bash -m stream-processor

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder --chown=stream-processor:stream-processor /app/.venv /app/.venv

# Copy application code
COPY --chown=stream-processor:stream-processor python/apps/kafka-stream-processor/main.py ./main.py

# Set environment to use venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-root user
USER stream-processor

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
