import streamlit as st
from PIL import Image
import json
import os
import pandas as pd  # <-- STEP 2: New Import!

# Import your custom AI engine
from ai_engine import analyze_civic_issue

# 1. Page Configuration
st.set_page_config(page_title="LocusTriage AI", page_icon="🏙️", layout="centered")

# 2. Header Section
st.title("🏙️ LocusTriage AI")
st.write("Upload a photo of a civic issue to automatically categorize and assess its urgency.")

# 3. Create the Dual-Interface Tabs
tab1, tab2 = st.tabs(["Citizen Portal", "Official Dashboard"])

# ==========================================
# TAB 1: CITIZEN PORTAL (with Step 3 Data Persistence)
# ==========================================
with tab1:
    st.subheader("Report an Issue")
    uploaded_file = st.file_uploader("Upload an image of the issue", type=["jpg", "jpeg", "png"])

    if uploaded_file is not None:
        # Display the uploaded image
        image = Image.open(uploaded_file)
        st.image(image, caption="Citizen Upload", use_container_width=True)
        
        # The Trigger Button
        if st.button("Analyze Issue", type="primary"):
            with st.spinner("AI is analyzing the hazard..."):
                
                # Save temporarily
                temp_path = os.path.join("assets", uploaded_file.name)
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                
                # Connect to the AI Brain
                result = analyze_civic_issue(temp_path)
                
                # Display Results
                st.subheader("Triage Report")
                try:
                    # Parse the JSON string into a Python dictionary
                    report_data = json.loads(result)
                    st.json(report_data)
                    
                    # ---------------------------------------------------------
                    # STEP 3: THE MEMORY BANK (Save to CSV)
                    # ---------------------------------------------------------
                    # Convert the single dictionary into a 1-row Pandas DataFrame
                    new_record = pd.DataFrame([report_data])
                    
                    # Append it to the bottom of the existing CSV file (mode='a')
                    # header=False prevents it from writing column names again
                    new_record.to_csv("data/historical_issues.csv", mode='a', header=False, index=False)
                    
                    st.success("✅ Issue logged successfully to the city database!")
                    # ---------------------------------------------------------

                except Exception:
                    st.error("Could not parse JSON. Raw output:")
                    st.write(result)
                
                # Clean up
                if os.path.exists(temp_path):
                    os.remove(temp_path)

# ==========================================
# TAB 2: OFFICIAL DASHBOARD 
# ==========================================
with tab2:
    st.header("📊 City Analytics Dashboard")
    
    try:
        # Load the database
        df = pd.read_csv("data/historical_issues.csv")
        
        # Create metric cards at the top
        col1, col2 = st.columns(2)
        col1.metric("Total Issues Reported", len(df))
        
        # Calculate the average urgency score safely
        if 'Urgency_Score' in df.columns:
            avg_urgency = round(df['Urgency_Score'].mean(), 1)
            col2.metric("Average Urgency Score", avg_urgency)
        
        st.divider()
        
        # Create a Bar Chart for Categories
        st.subheader("Issues by Category")
        if 'Category' in df.columns:
            category_counts = df['Category'].value_counts()
            st.bar_chart(category_counts)
        
        # Show the raw spreadsheet
        st.subheader("Live Database")
        st.dataframe(df, use_container_width=True)
        
    except FileNotFoundError:
        # THIS is the line that got deleted!
        st.warning("No historical data found. Please check your data folder!")