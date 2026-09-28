# 🏙️ LocusTriage-AI: Intelligent Municipal Hazard Triage System

**LocusTriage-AI** is a multimodal AI-driven civic issue triage and urban infrastructure dispatch platform. It empowers citizens to report urban hazards (potholes, open manholes, water leaks, broken streetlights, fallen trees) and provides city dispatchers with a real-time command center featuring 3D spatial mapping and live workflow status tracking.

---

## 🚀 Key Features

- **Multimodal AI Analysis**: Powered by Google **Gemini 2.5 Flash** with structured Pydantic schema validation.
- **Automated EXIF GPS & Geolocation**: Extracts coordinates directly from photo metadata or browser GPS.
- **Relational Data Persistence**: SQLite + SQLAlchemy ORM backend replacing legacy CSV appending.
- **Modern Next.js Frontend**: Dark-mode glassmorphic interface with interactive Carto Dark Matter spatial mapping.
- **Two-Tier Persona Architecture**:
  - **Citizen Portal**: Photo upload, instant severity score gauge (1-10), AI summary, and community upvotes.
  - **City Official Dashboard**: Live KPI metrics, category/urgency filtering, inline status updater (`Pending` ➔ `In Progress` ➔ `Resolved`), and one-click CSV export.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js](https://nextjs.org/) (React 19, TypeScript, Tailwind CSS, Lucide Icons) |
| **Spatial Mapping** | [Leaflet](https://leafletjs.com/) with CartoDB Dark Matter tiles |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+, Uvicorn) |
| **AI Engine** | [Google GenAI SDK](https://github.com/googleapis/python-genai) (`gemini-2.5-flash`) |
| **Database** | SQLite with [SQLAlchemy](https://www.sqlalchemy.org/) ORM |

---

## ⚡ Quick Start Guide

### 1. Backend Setup

1. Activate your virtual environment:
   ```bash
   .venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Set your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` in your browser.*

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/triage` | Upload image, run Gemini AI triage, and log issue to database |
| `GET` | `/api/issues` | Retrieve issues with category, status, and urgency filters |
| `GET` | `/api/issues/{id}` | Get single issue details |
| `PATCH` | `/api/issues/{id}` | Update issue status (`Pending`, `In Progress`, `Resolved`) or upvotes |
| `GET` | `/api/stats` | Retrieve aggregate metrics and category distribution |
| `GET` | `/api/export` | Download full database as a CSV export |
| `GET` | `/api/health` | Service health status check |