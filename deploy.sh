#!/bin/bash

# Exit on error
set -e

APP_NAME="borges-relojoaria"
REGION="us-central1" # Change this if you prefer another region

# Load environment variables from back-end/.env
if [ -f back-end/.env ]; then
  export $(grep -v '^#' back-end/.env | xargs)
else
  echo "Error: back-end/.env file not found."
  exit 1
fi

# Check required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: One or more required environment variables are missing."
  echo "Check SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY in back-end/.env"
  exit 1
fi

echo "Deploying $APP_NAME to Cloud Run..."

# Deploy using source
gcloud run deploy $APP_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL="$SUPABASE_URL",SUPABASE_KEY="$SUPABASE_KEY",GEMINI_API_KEY="$GEMINI_API_KEY"

echo "Deployment complete!"
