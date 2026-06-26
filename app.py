import streamlit as st
from PIL import Image
import json
import os

from ai_engine import analyze_civic_issue

#1. Page Config
st.set_page_config(page_title="LocusTriage-AI" , page_icon="🏙️" , layout="centered")

# 2. Header Section
st.title("🏙️ LocusTriage AI")
st.write("Upload a photo of a civic issue (like a pothole, broken streetlight, or illegal dumping) to automatically categorize and assess its urgency.")

# 3. File Uploader Widget
uploaded_file = st.file_uploader("Upload an image of the issue" ,  type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Display the uploaded image
    image = Image.open(uploaded_file)
    st.image(image, caption="Citizen Upload", use_container_width=True)

   # 4. The Trigger Button
    if st.button("Analyze Issue", type="primary"):
        with st.spinner("AI is analyzing the hazard..."):
            # Save the uploaded file temporarily so our engine can read it
            temp_path = os.path.join("assets", uploaded_file.name)
            with open(temp_path, "wb") as f:
                f.write(uploaded_file.getbuffer())

            # 5. Connect to the ai_engine
            result = analyze_civic_issue(temp_path)
            
            # 6. Display the results
            st.subheader("Triage Report")
            try:
                # Format the JSON for the dashboard
                report_data = json.loads(result)
                st.json(report_data)
            except Exception:
                # Fallback if there is a parsing error
                st.error("Could not parse JSON. Raw output:")
                st.write(result)
            
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)