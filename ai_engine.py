import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from PIL import Image

#1 Load secret key
load_dotenv()

#2 Intialize the AI client
client = genai.Client()

#3 Enforce the output structure
class CivicIssueReport(BaseModel):
    Category: str = Field(description="e.g., Pothole, Water Leak, Garbage, Streetlight")
    urgency_score: int = Field(description="Scale of 1-10")
    summary: str = Field(description="One concise sentence explaining the issue")
    
#4 The Core function
def analyze_civic_issue(image_path: str):
    """
    Takes any image path, sends it to Gemini, and returns a structured JSON report.
    """
    print(f"⏳ Sending {image_path} to Google AI Studio...")
    
    try:
        # Open whatever image Streamlit passes to this function
        issue_image = Image.open(image_path)
        prompt = "Analyze this image of a civic issue. Categorize it, rate the urgency (1-10), and provide a short summary."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt,issue_image],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CivicIssueReport,
                temperature=0.1,
            )
        )
        return response.text
    
    except FileNotFoundError:
        return f"❌ Error: Could not find image at {image_path}"
    except Exception as e:
        return f"❌ API Error: {e}"

#5 Local Test Block
if __name__ == "__main__":
    # This only runs if you type 'python ai_engine.py' in the terminal
    # It proves the function works before we connect it to the UI
    final_report = analyze_civic_issue("assets/pothole.jpg-org")
    print("\n✅ Official AI Report:")
    print(final_report)