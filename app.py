import pydeck as pdk
import streamlit as st
from PIL import Image
import json
import os
import pandas as pd  # <-- STEP 2: New Import!

# Import your custom AI engine
from ai_engine import analyze_civic_issue

# 1. Page Configuration
st.set_page_config(page_title="LocusTriage AI", page_icon="🏙️", layout="centered")
# --- CSS INJECTION ---
st.markdown("""
    <style>
    /* Hide ONLY the Streamlit watermark footer */
    footer {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)
# -----------------------------

# --- USER SIDEBAR ---
with st.sidebar:
    st.title("👤 User Profile")
    
    # Initialize session states for login and role
    if 'logged_in' not in st.session_state:
        st.session_state['logged_in'] = False
        st.session_state['role'] = None
        
    if not st.session_state['logged_in']:
        st.subheader("Login")
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        
        if st.button("Sign In"):
            if password == "admin123":
                st.session_state['logged_in'] = True
                st.session_state['role'] = "admin"
                st.rerun()
            elif password == "citizen123":
                st.session_state['logged_in'] = True
                st.session_state['role'] = "citizen"
                st.rerun()
            else:
                st.error("Invalid password. Try admin123 or citizen123")
    else:
        # What they see depends on their role!
        if st.session_state['role'] == "admin":
            st.success("Welcome back, City Official!")
            st.write("Role: **Administrator** 🛡️")
            st.divider()
            st.subheader("Admin Controls")
            st.button("⚙️ System Settings")
            st.button("📥 Export Full Database")
        else:
            st.success("Welcome back, Neighbor!")
            st.write("Role: **Citizen** 🏙️")
            st.divider()
            st.subheader("My Activity")
            st.button("📜 My Submitted Reports (2)")
            st.button("🔔 Notifications")
            
        if st.button("Logout"):
            st.session_state['logged_in'] = False
            st.session_state['role'] = None
            st.rerun()
# --------------------

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
                    
                    # --- 3A. ADD DEFAULT STATUS ---
                    new_record['Status'] = 'Pending'
                    # ------------------------------
                    
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
# TAB 2: OFFICIAL DASHBOARD (Step 2 Analytics)
# ==========================================
with tab2:
    if st.session_state.get('role') != "admin":
        # The Bouncer
        st.error("🔒 Access Denied")
        st.warning("Administrator clearance is required to view live city analytics. Please log in using an official city dispatcher account.")
    else:
        st.header("📊 City Analytics Dashboard")
        
        try:
            # Load the database
            df = pd.read_csv("data/historical_issues.csv")
            
            # --- 4. SMART DASHBOARD FILTERS ---
            if 'Category' in df.columns:
                all_categories = df['Category'].unique().tolist()
                selected_categories = st.multiselect(
                    "🔎 Filter by Category (Leave blank to view all):",
                    options=all_categories,
                    default=[]
                )
                
                # If the Admin selected specific categories, filter the dataframe!
                if selected_categories:
                    df = df[df['Category'].isin(selected_categories)]
            # ----------------------------------
            
            # Create metric cards at the top
            col1, col2 = st.columns(2)
            col1.metric("Total Issues Reported", len(df))
            
            # Calculate the average urgency score safely
            if 'Urgency_Score' in df.columns:
                avg_urgency = round(df['Urgency_Score'].mean(), 1)
                col2.metric("Average Urgency Score", avg_urgency)
            
            st.divider()
            
            # --- 1. NEW INTERACTIVE MAP FEATURE (PYDECK UPGRADE) ---
            st.subheader("🗺️ Live Issue Map")
            
            map_df = df.copy()
            map_df.columns = [col.lower() for col in map_df.columns]
            
            # Standardize names to strictly 'lat' and 'lon' for PyDeck
            if 'latitude' in map_df.columns:
                map_df = map_df.rename(columns={'latitude': 'lat', 'longitude': 'lon'})
                
            # Convert text coordinates to decimals safely
            for col in ['lat', 'lon']:
                if col in map_df.columns:
                    map_df[col] = pd.to_numeric(map_df[col], errors='coerce')
                    
            if 'lat' in map_df.columns and 'lon' in map_df.columns:
                clean_map = map_df.dropna(subset=['lat', 'lon'])
                
                if not clean_map.empty:
                    # 1. Set where the camera looks (calculating the center of your data)
                    view_state = pdk.ViewState(
                        latitude=clean_map['lat'].mean(),
                        longitude=clean_map['lon'].mean(),
                        zoom=11,
                        pitch=45  # This gives it a premium 3D angled look
                    )
                    
                    # 2. Design the data points
                    layer = pdk.Layer(
                        'ScatterplotLayer',
                        data=clean_map,
                        get_position='[lon, lat]',
                        get_color='[226, 54, 54, 200]',  # Sleek alert red
                        get_radius=150,
                    )
                    
                  # 3. Render the map using the free Carto provider
                    st.pydeck_chart(pdk.Deck(
                        map_provider='carto',
                        map_style='dark_matter', # <--- The actual Carto style name!
                        initial_view_state=view_state,
                        layers=[layer]
                    )) 
                else:
                    st.info("Map data unavailable: No valid coordinates found.")
            else:
                st.info("Map data unavailable: No latitude/longitude columns found.")
            # --------------------------------------
            
            # Create a Bar Chart for Categories
            st.subheader("Issues by Category")
            if 'Category' in df.columns:
                category_counts = df['Category'].value_counts()
                st.bar_chart(category_counts)
            
            # Show the raw spreadsheet
            st.subheader("Live Database")
            
            # --- 2. NEW DOWNLOAD REPORT FEATURE ---
            # Convert the current DataFrame into a CSV string bytes format for downloading
            csv_data = df.to_csv(index=False).encode('utf-8')
            
            st.download_button(
                label="📥 Export Full Database (CSV)",
                data=csv_data,
                file_name="city_historical_issues_export.csv",
                mime="text/csv",
                key="download-csv"
            )
            # --------------------------------------
            # --- 3B. LIVE STATUS TRACKER ---
            st.subheader("Live Database Editor")
            st.caption("Double-click a cell in the 'Status' column to update it.")
            
            # Safety check: If older records don't have a status yet, give them one
            if 'Status' not in df.columns:
                df['Status'] = 'Pending'
                
            # Create an editable grid with a dropdown specifically for the Status column
            edited_df = st.data_editor(
                df,
                column_config={
                    "Status": st.column_config.SelectboxColumn(
                        "Issue Status",
                        help="Update the repair status",
                        options=["Pending", "In Progress", "Resolved"],
                        required=True,
                    )
                },
                width="stretch",
                key="database_editor"
            )
            
            # Button to lock in the changes
            if st.button("💾 Save Changes to Database", type="primary"):
                edited_df.to_csv("data/historical_issues.csv", index=False)
                st.success("City database updated successfully!")
                st.rerun()
            # --------------------------------------
            
        except FileNotFoundError:
            # THIS is the line that got deleted!
            st.warning("No historical data found. Please check your data folder!")