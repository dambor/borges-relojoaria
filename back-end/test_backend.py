from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

# Mock environment variables before importing main
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "example-key"
os.environ["GEMINI_API_KEY"] = "example-key"

# Mock external dependencies
sys.modules["supabase"] = MagicMock()
sys.modules["google.genai"] = MagicMock()

# Now import main
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Borges Relojoaria API is running"}

@patch("main.supabase")
def test_get_repairs(mock_supabase):
    # Mock the chain: supabase.table().select().execute()
    mock_execute = MagicMock()
    mock_execute.data = [{"id": "1", "customerName": "Test", "description": "Test", "status": "PENDING", "date": "10 Out"}]
    
    mock_select = MagicMock()
    mock_select.execute.return_value = mock_execute
    
    mock_table = MagicMock()
    mock_table.select.return_value = mock_select
    
    mock_supabase.table.return_value = mock_table

    response = client.get("/repairs")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["customerName"] == "Test"

@patch("main.analyze_watch_image")
def test_analyze_base64(mock_analyze):
    mock_analyze.return_value = {"brand": "TestBrand", "type": "TestType", "features": "TestFeatures"}
    
    response = client.post("/analyze-base64", json={"image": "base64data"})
    assert response.status_code == 200
    assert response.json()["brand"] == "TestBrand"
