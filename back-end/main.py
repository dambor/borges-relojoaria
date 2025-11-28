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

@app.get("/")
def read_root():
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
    Handles Base64 image upload to Supabase Storage.
    """
    try:
        # Handle Image Upload
        if repair.imageUrl and repair.imageUrl.startswith("data:image"):
            try:
                import base64
                import uuid
                
                # 1. Parse Base64
                header, encoded = repair.imageUrl.split(",", 1)
                file_ext = header.split(";")[0].split("/")[1]
                image_data = base64.b64decode(encoded)
                
                # 2. Generate Filename
                filename = f"{uuid.uuid4()}.{file_ext}"
                
                # 3. Upload to Supabase Storage
                # Ensure 'repairs' bucket exists and is public
                bucket_name = "repairs"
                supabase.storage.from_(bucket_name).upload(
                    path=filename,
                    file=image_data,
                    file_options={"content-type": f"image/{file_ext}"}
                )
                
                # 4. Get Public URL
                public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
                
                # 5. Update repair object with URL
                repair.imageUrl = public_url
                
            except Exception as e:
                print(f"Image upload failed: {e}")
                # Fallback: keep the base64 string or fail? 
                # Let's log and proceed (or fail if critical). 
                # For now, we proceed, but it might fail DB insert if too large.
                pass

        # Exclude id if it's None so Supabase generates it (if configured)
        # Or if we are generating it on frontend, we keep it.
        # The frontend generates a timestamp ID, which is fine for now.
        data = repair.model_dump(exclude_none=True)
        response = supabase.table("repairs").insert(data).execute()
        
        if len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=500, detail="Failed to create repair")
    except Exception as e:
        print(f"Error in create_repair: {e}")
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

# API Endpoints (Keep existing ones)
