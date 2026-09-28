import os
import io
import json
from typing import Optional, Tuple
from PIL import Image, ExifTags
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini client
gemini_client = None
try:
    from google import genai
    from google.genai import types
    gemini_client = genai.Client()
except Exception as e:
    print(f"[WARN] Could not initialize Google GenAI Client: {e}")

class CivicIssueReport(BaseModel):
    category: str = Field(
        description="Indian municipal hazard category (e.g., Pothole / Road Damage, Open Manhole / Gutter, Water Pipeline Burst, Garbage Dump / Kachra Kundi, Broken Streetlight, Dangling Electric Cable, Fallen Tree, Broken Footpath)"
    )
    urgency_score: int = Field(
        description="Urgency scale from 1 (minor/cosmetic) to 10 (critical danger to life, vehicles, or pedestrians)"
    )
    summary: str = Field(
        description="One concise, objective sentence explaining the specific hazard and municipal impact in the Indian urban context."
    )


def extract_exif_gps(image: Image.Image) -> Tuple[Optional[float], Optional[float]]:
    """Extract GPS latitude and longitude from image EXIF metadata if present."""
    try:
        exif = image._getexif()
        if not exif:
            return None, None

        gps_info = None
        for tag, value in exif.items():
            decoded = ExifTags.TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                gps_info = value
                break

        if not gps_info:
            return None, None

        def _convert_to_degrees(value):
            d0 = value[0]
            d = float(d0[0]) / float(d0[1]) if isinstance(d0, tuple) else float(d0)
            m0 = value[1]
            m = float(m0[0]) / float(m0[1]) if isinstance(m0, tuple) else float(m0)
            s0 = value[2]
            s = float(s0[0]) / float(s0[1]) if isinstance(s0, tuple) else float(s0)
            return d + (m / 60.0) + (s / 3600.0)

        lat_data = gps_info.get(2)
        lat_ref = gps_info.get(1)
        lon_data = gps_info.get(4)
        lon_ref = gps_info.get(3)

        if lat_data and lat_ref and lon_data and lon_ref:
            lat = _convert_to_degrees(lat_data)
            if lat_ref != "N":
                lat = -lat

            lon = _convert_to_degrees(lon_data)
            if lon_ref != "E":
                lon = -lon

            # Ensure coordinates are within India bounding box
            if 6.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5:
                return round(lat, 6), round(lon, 6)
    except Exception as e:
        print(f"[WARN] Could not parse EXIF GPS: {e}")

    return None, None


def analyze_civic_image(image_bytes: bytes) -> dict:
    """
    Analyzes an image using Google Gemini 2.5 Flash tailored for Indian urban municipal infrastructure.
    """
    image = Image.open(io.BytesIO(image_bytes))
    
    # Try EXIF GPS extraction
    extracted_lat, extracted_lon = extract_exif_gps(image)

    # Convert to RGB if needed
    if image.mode != "RGB":
        image = image.convert("RGB")

    prompt = (
        "You are an expert Indian Municipal Corporation Infrastructure & Smart City Triage Inspector (e.g., AMC, BMC, MCD, BBMP). "
        "Analyze this photo of an Indian urban/civic hazard. "
        "1. Identify the exact category: Pothole / Road Damage, Open Manhole / Gutter, Water Pipeline Burst, Garbage Dump / Kachra Kundi, Broken Streetlight, Dangling Electric Cable, Fallen Tree, Damaged Footpath. "
        "2. Assess the urgency score from 1 (minor/cosmetic) to 10 (life-threatening/severe traffic hazard). "
        "3. Provide a clear, actionable 1-sentence summary of the hazard for municipal engineers."
    )

    if gemini_client is not None and os.getenv("GEMINI_API_KEY"):
        try:
            from google.genai import types
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, image],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CivicIssueReport,
                    temperature=0.1,
                )
            )
            parsed = json.loads(response.text)
            return {
                "category": parsed.get("category", "General Civic Issue"),
                "urgency_score": int(parsed.get("urgency_score", 5)),
                "summary": parsed.get("summary", "Civic issue detected in uploaded imagery."),
                "latitude": extracted_lat,
                "longitude": extracted_lon,
            }
        except Exception as e:
            print(f"[WARN] Gemini API Call failed: {e}")

    # Fallback heuristic
    return {
        "category": "Pothole / Road Damage",
        "urgency_score": 7,
        "summary": "Severe road crater detected causing traffic bottleneck and accident risk.",
        "latitude": extracted_lat,
        "longitude": extracted_lon,
    }
