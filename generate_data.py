import pandas as pd
import numpy as np
import uuid

# Number of mock issues to generate for the hackathon demo
NUM_RECORDS = 30

# Ahmedabad City center coordinates
BASE_LAT = 23.0216
BASE_LON = 72.5797

# Civic Issue Categories
categories = ['Pothole', 'Water Leak', 'Garbage Dump', 'Broken Streetlight', 'Fallen Tree', 'Open Manhole']

# Skew the status heavily towards 'Open' so the map looks active
statuses = ['Open', 'Open', 'Open', 'Open', 'Resolved']

data = []

for _ in range(NUM_RECORDS):
    category = np.random.choice(categories)
    if category in ['Open Manhole' , 'Fallen Tree']:
        urgency = np.random.randint(7,11) #High Urgency
    elif category in ['Garbage Dump', 'Broken Streetlight']:
        urgency = np.random.randint(2,6) #Low-Medium Urgency
    else:  
        urgency=np.random.randint(4,9) #Medium-High Urgency
        
    record = {
        'Issue_ID': f"ISSUE-{str(uuid.uuid4())[:6].upper()}",
        # Scatter the points realistically around Ahmedabad (approx ~5-8km radius)
        'Latitude': BASE_LAT + np.random.uniform(-0.05, 0.05), 
        'Longitude': BASE_LON + np.random.uniform(-0.06, 0.06),
        'Category': category,
        'Urgency_Score': urgency,
        'Description': f"Mock citizen report indicating a {category.lower()} at this location.",
        'Status': np.random.choice(statuses),
        'Upvotes': np.random.randint(0, 45) # Simulating community verification
    }
    data.append(record)
    
# Create a Pandas DataFrame and export it
df=pd.DataFrame(data)
df.to_csv('historical_issues.csv', index=False)
print(f"✅ Successfully generated 'historical_issues.csv' with {NUM_RECORDS} mock records for Ahmedabad!")