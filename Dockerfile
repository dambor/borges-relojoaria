FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY back-end/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY back-end/ ./

# Set environment variables
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the application
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
