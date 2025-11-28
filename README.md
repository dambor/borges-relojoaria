# Borges Relojoaria App

A full-stack application for managing watch repair requests, featuring AI-powered image analysis.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Python, FastAPI, Supabase (PostgreSQL), Google Gemini AI
- **Infrastructure**: Docker, Google Cloud Run

## Prerequisites
- Node.js & npm
- Python 3.11+
- Docker
- Google Cloud SDK (`gcloud`)
- Supabase Account
- Google Gemini API Key

## Setup & Local Development

### 1. Environment Variables
Create a `.env` file in `back-end/` based on `.env.example`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Database Setup
Run the SQL commands in `back-end/schema.sql` in your Supabase SQL Editor to create the necessary tables and policies.

### 3. Run Locally (Manual)

**Backend:**
```bash
cd back-end
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd front-end
npm install
npm run dev
```

### 4. Run Locally (Docker)
You can build and run the entire app in a single container:
```bash
docker build -t borges-relojoaria .
docker run -p 8080:8080 --env-file back-end/.env borges-relojoaria
```
Access at `http://localhost:8080`.

## Deployment (Google Cloud Run)

### 1. Authenticate
Ensure you are logged in to gcloud:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Deploy
Use the provided script to deploy. Make sure your environment variables are exported first.

```bash
# Export env vars from your local file
export $(grep -v '^#' back-end/.env | xargs)

# Run deployment script
sh deploy.sh
```

The script will:
1.  Upload the source code to Google Cloud Build.
2.  Build the Docker image.
3.  Deploy the container to Cloud Run.
4.  Set the necessary environment variables.

### Troubleshooting Deployment
If the container fails to start:
- Check Cloud Run logs.
- Ensure `SUPABASE_URL`, `SUPABASE_KEY`, and `GEMINI_API_KEY` are correctly set.
- Ensure the port is configured correctly (the Dockerfile uses `$PORT` or defaults to 8080).
