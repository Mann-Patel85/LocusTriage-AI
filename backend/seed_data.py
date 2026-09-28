import os
import uuid
import random
from pathlib import Path
import pandas as pd

try:
    from backend.database import engine, Base, SessionLocal
    from backend.models import CivicIssue
except ImportError:
    from database import engine, Base, SessionLocal
    from models import CivicIssue

# Indian City Center Coordinates
INDIAN_CITIES = [
    {
        "name": "Ahmedabad",
        "state": "Gujarat",
        "agency": "AMC",
        "lat": 23.0225,
        "lon": 72.5714,
        "landmarks": [
            "SG Highway near Bodakdev",
            "Prahlad Nagar Road",
            "Vastrapur Lake Circle",
            "Navrangpura Main Road",
            "Maninagar Railway Cross",
            "C.G. Road",
            "Satellite Shyamal Cross",
            "Ghatlodia Ward 8",
            "Chandkheda Ring Road",
            "Bopal-Ambli Road",
            "Paldi Bus Stop",
            "Ashram Road near Income Tax",
            "Drive-in Road",
            "Sindhu Bhavan Marg",
            "Nikol Ring Road",
        ],
    },
    {
        "name": "Mumbai",
        "state": "Maharashtra",
        "agency": "BMC",
        "lat": 19.0760,
        "lon": 72.8777,
        "landmarks": [
            "Western Express Highway, Andheri",
            "Linking Road, Bandra West",
            "S.V. Road, Goregaon",
            "LBS Marg, Kurla",
            "Dadar TT Circle",
            "Powai Lake Road",
            "Ghatkopar Station Road",
        ],
    },
    {
        "name": "Delhi-NCR",
        "state": "Delhi",
        "agency": "MCD",
        "lat": 28.6139,
        "lon": 77.2090,
        "landmarks": [
            "Ring Road, Lajpat Nagar",
            "Connaught Place Outer Circle",
            "Rohini Sector 11",
            "Dwarka Sector 6 Underpass",
            "Vikas Marg, Laxmi Nagar",
            "Janakpuri West Metro Road",
        ],
    },
    {
        "name": "Bengaluru",
        "state": "Karnataka",
        "agency": "BBMP",
        "lat": 12.9716,
        "lon": 77.5946,
        "landmarks": [
            "Outer Ring Road, Marathahalli",
            "100ft Road, Indiranagar",
            "Silk Board Junction",
            "Koramangala 4th Block",
            "Whitefield Main Road",
            "Hebbal Flyover Service Road",
        ],
    },
]

INDIAN_CATEGORIES = [
    {
        "category": "Pothole / Road Cavity",
        "urgency_range": (6, 9),
        "desc": "Deep road crater causing severe vehicle damage and traffic bottleneck on {loc}.",
    },
    {
        "category": "Open Manhole / Gutter",
        "urgency_range": (8, 10),
        "desc": "Uncovered sewer chamber posing critical fatal falling hazard to pedestrians at {loc}.",
    },
    {
        "category": "Water Pipeline Burst",
        "urgency_range": (7, 9),
        "desc": "High pressure drinking water main pipeline leak submerging carriageway at {loc}.",
    },
    {
        "category": "Garbage Dump / Kachra Kundi",
        "urgency_range": (3, 6),
        "desc": "Overflowing municipal waste collection vat spilling into the street near {loc}.",
    },
    {
        "category": "Broken Streetlight / Dark Spot",
        "urgency_range": (4, 7),
        "desc": "Non-functional sodium/LED street illumination creating unsafe dark corridor at {loc}.",
    },
    {
        "category": "Fallen Tree / Heavy Bough",
        "urgency_range": (7, 10),
        "desc": "Uprooted monsoon tree obstructing dual carriageway and pedestrian access at {loc}.",
    },
    {
        "category": "Dangling Electric Cable",
        "urgency_range": (8, 10),
        "desc": "Low-hanging damaged power conductor cable posing electrocution threat near {loc}.",
    },
    {
        "category": "Broken Footpath / Paver Blocks",
        "urgency_range": (2, 5),
        "desc": "Dislodged pavement paver tiles creating tripping risk for senior citizens at {loc}.",
    },
]

STATUSES = ["Pending", "Pending", "In Progress", "In Progress", "Resolved"]

def generate_indian_civic_issues(num_records=120):
    """Generates authentic geo-tagged Indian municipal civic issues."""
    records = []
    
    for i in range(num_records):
        # 70% Ahmedabad / Gujarat (Hub), 30% Major Metros
        city = INDIAN_CITIES[0] if random.random() < 0.70 else random.choice(INDIAN_CITIES)
        landmark = random.choice(city["landmarks"])
        cat_info = random.choice(INDIAN_CATEGORIES)
        
        # Scatter realistically ~6-10km from city center
        lat = round(city["lat"] + random.uniform(-0.065, 0.065), 6)
        lon = round(city["lon"] + random.uniform(-0.065, 0.065), 6)
        
        urgency = random.randint(cat_info["urgency_range"][0], cat_info["urgency_range"][1])
        status = random.choice(STATUSES)
        upvotes = random.randint(1, 48)
        issue_id = f"IND-{city['agency']}-{random.randint(10000, 99999)}"
        description = cat_info["desc"].format(loc=f"{landmark}, {city['name']}")

        records.append({
            "Issue_ID": issue_id,
            "Category": cat_info["category"],
            "Urgency_Score": urgency,
            "Status": status,
            "Description": description,
            "Latitude": lat,
            "Longitude": lon,
            "Upvotes": upvotes,
        })

    return records


def seed_historical_data(force_reseed=False):
    """Seed authentic Indian civic issues into SQLite database and CSV."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing_count = db.query(CivicIssue).count()
    if existing_count > 0 and not force_reseed:
        # Check if database has old NYC records (lat > 38)
        sample = db.query(CivicIssue).first()
        if sample and sample.latitude and sample.latitude < 37 and sample.latitude > 6:
            print(f"[INFO] Indian database already verified ({existing_count} records). Skipping seed.")
            db.close()
            return
        else:
            print("[INFO] Purging old non-Indian records from database...")
            db.query(CivicIssue).delete()
            db.commit()

    print("[INFO] Generating 120 authentic Indian municipal civic issues...")
    raw_records = generate_indian_civic_issues(120)
    
    # Save CSV
    csv_path = Path(__file__).resolve().parent.parent / "data" / "historical_issues.csv"
    df = pd.DataFrame(raw_records)
    df.to_csv(csv_path, index=False)

    # Insert into SQLite
    model_records = [
        CivicIssue(
            issue_id=r["Issue_ID"],
            latitude=r["Latitude"],
            longitude=r["Longitude"],
            category=r["Category"],
            urgency_score=r["Urgency_Score"],
            description=r["Description"],
            status=r["Status"],
            upvotes=r["Upvotes"],
        )
        for r in raw_records
    ]

    db.add_all(model_records)
    db.commit()
    print(f"[OK] Successfully populated {len(model_records)} Indian civic hazard records into SQLite & CSV!")
    db.close()

if __name__ == "__main__":
    seed_historical_data(force_reseed=True)
