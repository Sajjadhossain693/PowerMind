# Multi-stage Dockerfile for PowerMind (GridWise LLM)
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies for build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime stage
FROM python:3.12-slim

WORKDIR /app

# Install curl for docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application source code
COPY app ./app
COPY README.md ./README.md
COPY scripts ./scripts

# Copy application source code
COPY app ./app
COPY README.md ./README.md
COPY scripts ./scripts

# Expose canonical API port
EXPOSE 8000

# Expose canonical API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch production server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
