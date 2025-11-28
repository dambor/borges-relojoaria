import os
import json
from google import genai
from google.genai import types
from models import WatchAnalysis
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    # We don't raise here immediately to allow the app to start, 
    # but analysis will fail if key is missing.
    print("Warning: GEMINI_API_KEY not set")

client = genai.Client(api_key=api_key)

async def analyze_watch_image(base64_image: str) -> WatchAnalysis:
    try:
        # Extract mime type if present, default to image/jpeg
        # In Python we might need to handle the base64 string a bit differently 
        # if it comes with the data prefix.
        
        # Remove data URL prefix if present
        if "base64," in base64_image:
            clean_base64 = base64_image.split("base64,")[1]
        else:
            clean_base64 = base64_image

        # We need to pass the raw bytes or the base64 string correctly.
        # The google-genai SDK for Python handles base64 strings in inline_data.
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    parts=[
                        types.Part(
                            inline_data=types.Blob(
                                mime_type="image/jpeg", # Assuming jpeg for simplicity, or extract from header
                                data=clean_base64
                            )
                        ),
                        types.Part(
                            text="Analise esta imagem de um relógio. Identifique a marca provável (Brand), o tipo de relógio (ex: Analógico, Digital, Smartwatch, Bolso) e características visuais notáveis."
                        )
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "brand": {"type": "STRING", "description": "Marca do relógio"},
                        "type": {"type": "STRING", "description": "Tipo do mecanismo ou estilo"},
                        "features": {"type": "STRING", "description": "Características visuais breves"},
                    },
                    "required": ["brand", "type", "features"],
                }
            )
        )

        if response.text:
            data = json.loads(response.text)
            return WatchAnalysis(**data)
        
        raise ValueError("No response text from Gemini")

    except Exception as e:
        print(f"Error in Gemini analysis: {e}")
        return WatchAnalysis(
            brand="",
            type="",
            features="Não foi possível analisar automaticamente. Por favor preencha manualmente."
        )
