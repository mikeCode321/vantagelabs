# Base image
FROM python:3.11-slim

# Environment settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# System dependencies (needed for psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency metadata first (better caching)
COPY pyproject.toml .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install .

# Copy application code
COPY . .

# Expose FastAPI port
EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
# Start server
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]