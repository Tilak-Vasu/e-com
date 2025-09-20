# --- STAGE 1: The "Builder" Stage ---
FROM python:3.11-slim as builder
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies including PostgreSQL dev libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

# --- STAGE 2: The "Final" Production Stage ---
FROM python:3.11-slim
WORKDIR /app

# Install runtime dependencies including PostgreSQL client libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
 && rm -rf /var/lib/apt/lists/*

# Copy wheels and install dependencies
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy all backend files
COPY . .

# Change working directory to the inner backend folder where Django project is
WORKDIR /app/backend

EXPOSE 8000

# Health check - use your existing health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run from the correct directory where manage.py is located
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]