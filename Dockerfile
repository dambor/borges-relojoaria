# Build Frontend
FROM node:20-alpine as build
WORKDIR /app/frontend
COPY front-end/package*.json ./
RUN npm ci
COPY front-end/ ./
RUN npm run build

# Build Backend
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

# Copy built frontend assets from build stage
# We copy them to a 'static' directory in the container
COPY --from=build /app/frontend/dist ./static

# Set environment variables
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the application
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
