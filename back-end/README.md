# Borges Relojoaria Backend

This is the backend for the Borges Relojoaria application, built with FastAPI and Supabase.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    - `SUPABASE_URL`: Your Supabase project URL.
    - `SUPABASE_KEY`: Your Supabase anonymous key.
    - `GEMINI_API_KEY`: Your Google Gemini API key.

3.  **Database Setup**:
    The application requires a `repairs` table in Supabase.
    -   Go to your Supabase Dashboard -> **SQL Editor**.
    -   Copy the contents of `schema.sql`.
    -   Run the SQL to create the table and policies.

4.  **Run the Server**:
    ```bash
    uvicorn main:app --reload
    ```

## API Endpoints

-   `GET /`: Health check.
-   `POST /analyze`: Upload an image for AI analysis.
-   `POST /analyze-base64`: Send a base64 image string for AI analysis.
-   `GET /repairs`: List repairs. Supports `user_phone` query param to filter by user (or show all for Admin).
-   `POST /repairs`: Create a new repair.
-   `GET /repairs/{id}`: Get a specific repair.
-   `PUT /repairs/{id}`: Update a repair.
-   `GET /users/{phone}`: Get user details by phone.
-   `POST /users`: Register a new user.
-   `GET /admin-phone`: Get the phone number of the first Admin user.

## Testing

Run the tests with:
```bash
pytest test_backend.py
```
