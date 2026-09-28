# Lightweight Python Base Image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and initial seed data
COPY backend ./backend
COPY data ./data
COPY uploads ./uploads

# Ensure upload directory exists
RUN mkdir -p /app/uploads /app/data

# Default port (supports Google Cloud Run's dynamic $PORT env var)
ENV PORT=8000
EXPOSE 8000

# Start FastAPI server using uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]