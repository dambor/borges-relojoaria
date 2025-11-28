from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

from models import RepairItem, WatchAnalysis, User
from database import supabase
from service import analyze_watch_image

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="Borges Relojoaria API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Static Files (Frontend)
# Ensure the 'static' directory exists (it will in the container)
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    # We might need to mount other static folders if they exist, or just root
    # But mounting root "/" as StaticFiles interferes with API routes.
    # So we serve specific assets and then a catch-all for index.html

@app.get("/")
async def read_root():
    # If static/index.html exists, serve it. Otherwise return API status.
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Borges Relojoaria API is running"}

# API Endpoints (Keep existing ones)


@app.post("/analyze", response_model=WatchAnalysis)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyzes an uploaded image using Gemini AI to identify watch details.
    """
    try:
        contents = await file.read()
        # Convert bytes to base64 string if needed, or pass bytes directly if service handles it.
        # Our service expects a base64 string (or we can modify it to take bytes).
        # Let's convert to base64 here to match the service signature.
        import base64
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        analysis = await analyze_watch_image(base64_image)
        return analysis
    except Exception as e:
        print(f"Error in analyze_image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-base64", response_model=WatchAnalysis)
async def analyze_image_base64(item: dict):
    """
    Analyzes a base64 image string.
    Expects JSON: {"image": "base64string..."}
    """
    try:
        image_data = item.get("image")
        if not image_data:
            raise HTTPException(status_code=400, detail="Image data required")
            
        analysis = await analyze_watch_image(image_data)
        return analysis
    except Exception as e:
        print(f"Error in get_repairs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repairs", response_model=List[RepairItem])
def get_repairs(user_phone: Optional[str] = None):
    """
    Fetches repairs.
    - If user_phone is provided:
        - If user is ADMIN: Returns ALL repairs.
        - If user is CUSTOMER: Returns ONLY their repairs.
    - If no user_phone: Returns empty list (or all, depending on security choice. Let's be safe and return empty or require phone).
      For now, if no phone, we return all (legacy behavior) or maybe empty.
      Let's enforce phone for filtering.
    """
    try:
        query = supabase.table("repairs").select("*")
        
        if user_phone:
            # Check user role
            user_res = supabase.table("users").select("role").eq("phone", user_phone).execute()
            if len(user_res.data) > 0:
                role = user_res.data[0].get("role", "CUSTOMER")
                if role == 'ADMIN':
                    pass # Return all
                else:
                    query = query.eq("user_phone", user_phone)
            else:
                # User not found, maybe return nothing or just their own (if logic allows)
                query = query.eq("user_phone", user_phone)
        
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error in get_repairs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/repairs", response_model=RepairItem)
def create_repair(repair: RepairItem):
    """
    Creates a new repair in Supabase.
    """
    try:
        # Exclude id if it's None so Supabase generates it (if configured)
        # Or if we are generating it on frontend, we keep it.
        # The frontend generates a timestamp ID, which is fine for now.
        data = repair.model_dump(exclude_none=True)
        response = supabase.table("repairs").insert(data).execute()
        
        if len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=500, detail="Failed to create repair")
    except Exception as e:
        print(f"Error in get_repairs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repairs/{repair_id}", response_model=RepairItem)
def get_repair(repair_id: str):
    """
    Fetches a single repair by ID.
    """
    try:
        response = supabase.table("repairs").select("*").eq("id", repair_id).execute()
        if len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Repair not found")
    except Exception as e:
        print(f"Error in get_repairs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/repairs/{repair_id}", response_model=RepairItem)
def update_repair(repair_id: str, repair: RepairItem):
    """
    Updates a repair.
    """
    try:
        data = repair.model_dump(exclude_none=True)
        response = supabase.table("repairs").update(data).eq("id", repair_id).execute()
        if len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Repair not found")
    except Exception as e:
        print(f"Error in update_repair: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{phone}", response_model=User)
def get_user(phone: str):
    """
    Checks if a user exists by phone number.
    """
    try:
        response = supabase.table("users").select("*").eq("phone", phone).execute()
        if len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        print(f"Error in get_user: {e}")
        # If it's a 404 from our logic above, re-raise it.
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users", response_model=User)
def create_user(user: User):
    """
    Registers a new user.
    """
    try:
        data = user.model_dump()
        response = supabase.table("users").insert(data).execute()
        if len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=500, detail="Failed to create user")
    except Exception as e:
        print(f"Error in create_user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin-phone")
def get_admin_phone():
    """
    Returns the phone number of the first found Admin user.
    """
    try:
        response = supabase.table("users").select("phone").eq("role", "ADMIN").limit(1).execute()
        if len(response.data) > 0:
            return {"phone": response.data[0]["phone"]}
        # Fallback if no admin found
        return {"phone": "5511999999999"} 
    except Exception as e:
        print(f"Error in get_admin_phone: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Catch-all for SPA (Must be last)
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    raise HTTPException(status_code=404, detail="Not Found")
