import os
import random
import hashlib
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from faker import Faker

fake = Faker()
Faker.seed(42)
random.seed(42)
np.random.seed(42)

# Output directory for data CSVs
DATA_DIR = os.path.join(os.path.dirname(__file__), "csv")
os.makedirs(DATA_DIR, exist_ok=True)

# 12 distinct product/service categories
CATEGORIES = [
    "IT Hardware", 
    "Software Licenses", 
    "Office Furniture", 
    "Office Supplies", 
    "Logistics & Shipping", 
    "Raw Metals", 
    "Chemical Materials", 
    "Janitorial Services", 
    "Security Services", 
    "HVAC & Maintenance", 
    "Marketing & Print", 
    "Catering Services"
]

def generate_vendors(num_vendors=500):
    print(f"Generating {num_vendors} vendors across {len(CATEGORIES)} categories...")
    vendors = []
    for i in range(1, num_vendors + 1):
        # Correlate metrics: higher base quality -> higher rating, reliability, lower delays & defects
        base_quality = np.random.uniform(0.5, 1.0)
        rating = np.round(2.5 + 2.5 * base_quality, 2)
        reliability = np.round(base_quality, 3)
        avg_delay_days = np.round(np.random.exponential(scale=(1.0 - base_quality) * 7.0), 2)
        defect_rate = np.round(np.random.uniform(0, 0.08 * (2.0 - base_quality)), 4)
        completion_rate = np.round(np.random.uniform(0.75, 1.0) if base_quality > 0.7 else np.random.uniform(0.50, 0.85), 3)
        
        vendors.append({
            "vendor_id": f"VND-{i:04d}",
            "name": fake.company(),
            "category": random.choice(CATEGORIES),
            "historical_rating": rating,
            "reliability_score": reliability,
            "avg_delay_days": avg_delay_days,
            "defect_rate": defect_rate,
            "historical_completion_rate": completion_rate
        })
    df = pd.DataFrame(vendors)
    df.to_csv(os.path.join(DATA_DIR, "vendors.csv"), index=False)
    print("Saved vendors.csv")
    return vendors

def generate_procurement_requests(num_requests=150):
    print(f"Generating {num_requests} procurement requests...")
    requests = []
    base_date = datetime(2026, 1, 1)
    
    titles_by_cat = {
        "IT Hardware": ["Enterprise Laptops Purchase", "Server Rack Infrastructure Upgrade", "Network Switch Deployments", "Desktop Workstation Fleet"],
        "Software Licenses": ["Cloud ERP Subscription Renewal", "Cybersecurity Suite Licenses", "OS Upgrade Enterprise Agreement", "BI Analytics Platform Licenses"],
        "Office Furniture": ["Ergonomic Seating Bulk Order", "Adjustable Standing Desks", "Conference Room Furniture Setup", "Reception Lounge Renovation"],
        "Office Supplies": ["Stationery Bulk Annual Contract", "Laser Printer Toners & Papers", "General Consumables Lot", "Shared Pantry Essentials"],
        "Logistics & Shipping": ["Inter-State Freight Shipping", "Courier & Last-Mile Delivery SLA", "Bulk Equipment Shipping Services", "Supply Chain Warehouse Distribution"],
        "Raw Metals": ["Steel Tubes & Sheets Supply", "Aluminum Extrusion Profiles", "Industrial Copper Wire Coils", "Raw Brass & Alloys Supply"],
        "Chemical Materials": ["Industrial Cleaning Solvents", "Adhesives & Resins Bulk", "Polymers & Plastic Pellets", "Water Treatment Chemicals"],
        "Janitorial Services": ["Daily Office Janitorial Contract", "Specialized Window Cleaning Lot", "Carpet & Deep Clean SLA", "Sanitization & Disinfection Contract"],
        "Security Services": ["HQ Security Guard Deployment", "CCTV Monitoring & Patrol Service", "Access Control Hardware & Service", "Event Crowd Management Services"],
        "HVAC & Maintenance": ["Chiller System Maintenance Service", "Elevator Periodic Service SLA", "Office Electrical Maintenance", "Fire Safety Systems Audit"],
        "Marketing & Print": ["Billboard Campaign Printing", "Event Brochure & Poster Print", "Promotional Merchandise Lot", "Annual Report High-Volume Print"],
        "Catering Services": ["Daily Office Cafeteria Food SLA", "Annual Corporate Gala Catering", "Executive Lunch Board Meetings", "Weekly Friday Happy Hour Snacks"]
    }
    
    for i in range(1, num_requests + 1):
        category = random.choice(CATEGORIES)
        title = random.choice(titles_by_cat[category])
        max_budget = float(np.round(np.random.uniform(5000, 200000), 2))
        qty = random.randint(5, 1000)
        created_at = base_date + timedelta(days=random.randint(1, 180), hours=random.randint(0, 23))
        
        requests.append({
            "request_id": f"REQ-{i:03d}",
            "title": f"{title} (Lot {i:03d})",
            "category": category,
            "quantity": qty,
            "max_budget": max_budget,
            "deadline_days": random.randint(7, 45),
            "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    df = pd.DataFrame(requests)
    df.to_csv(os.path.join(DATA_DIR, "procurement_requests.csv"), index=False)
    print("Saved procurement_requests.csv")
    return requests

def generate_bids_and_fraud(vendors, requests):
    print("Generating bid histories and live bidding...")
    bids = []
    fraud_alerts = []
    
    # 15% of requests involve colluding bidding
    num_requests = len(requests)
    collusive_req_indices = set(random.sample(range(num_requests), int(num_requests * 0.15)))
    
    bid_id_counter = 1
    fraud_alert_counter = 1
    
    for req_idx, req in enumerate(requests):
        req_id = req["request_id"]
        category = req["category"]
        max_budget = req["max_budget"]
        created_at_dt = datetime.strptime(req["created_at"], "%Y-%m-%d %H:%M:%S")
        
        # Filter vendors by category
        matching_vendors = [v for v in vendors if v["category"] == category]
        # Fallback to make sure there are enough vendors
        if len(matching_vendors) < 3:
            matching_vendors = [v for v in vendors if v["vendor_id"] in [f"VND-{x:04d}" for x in range(1, 20)]]
            
        is_collusive = req_idx in collusive_req_indices
        auction_start = created_at_dt + timedelta(days=1)
        
        if is_collusive:
            # Collusion (Fraud)
            colluding_vendors = random.sample(matching_vendors, 2)
            other_vendors = [v for v in matching_vendors if v not in colluding_vendors]
            
            current_price = max_budget * 0.95
            bid_time = auction_start
            
            for round_num in range(10):
                bidder = colluding_vendors[round_num % 2]
                current_price -= 150.0  # Identical incremental price drops
                bid_time += timedelta(seconds=random.randint(1, 2))  # Bids within seconds (high speed)
                
                bids.append({
                    "bid_id": f"BID-{bid_id_counter:05d}",
                    "request_id": req_id,
                    "vendor_id": bidder["vendor_id"],
                    "bid_price": round(current_price, 2),
                    "bid_timestamp": bid_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "is_fraudulent_flag": 1,
                    "collusion_group": f"COL-{req_id}"
                })
                bid_id_counter += 1
                
            for vendor in other_vendors[:2]:
                bid_time += timedelta(minutes=random.randint(5, 10))
                bids.append({
                    "bid_id": f"BID-{bid_id_counter:05d}",
                    "request_id": req_id,
                    "vendor_id": vendor["vendor_id"],
                    "bid_price": round(max_budget * random.uniform(0.85, 0.92), 2),
                    "bid_timestamp": bid_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "is_fraudulent_flag": 0,
                    "collusion_group": None
                })
                bid_id_counter += 1
                
            fraud_alerts.append({
                "alert_id": f"FRD-{fraud_alert_counter:03d}",
                "request_id": req_id,
                "description": f"Suspicious bidding pattern: rapid alternating bids with identical step decrements between {colluding_vendors[0]['vendor_id']} and {colluding_vendors[1]['vendor_id']}.",
                "timestamp": (auction_start + timedelta(seconds=20)).strftime("%Y-%m-%d %H:%M:%S"),
                "severity": "HIGH",
                "vendor_ids_involved": f"{colluding_vendors[0]['vendor_id']},{colluding_vendors[1]['vendor_id']}"
            })
            fraud_alert_counter += 1
            
        else:
            # Regular competitive bidding
            num_participants = min(len(matching_vendors), random.randint(3, 7))
            participants = random.sample(matching_vendors, num_participants)
            
            current_lowest = max_budget
            bid_time = auction_start
            
            for _ in range(random.randint(6, 15)):
                vendor = random.choice(participants)
                reduction = current_lowest * random.uniform(0.005, 0.025)
                bid_price = current_lowest - reduction
                
                min_acceptable = max_budget * (0.72 + (vendor["historical_rating"] - 2.5) * 0.04)
                if bid_price < min_acceptable:
                    continue
                
                current_lowest = bid_price
                bid_time += timedelta(minutes=random.randint(2, 10))
                
                bids.append({
                    "bid_id": f"BID-{bid_id_counter:05d}",
                    "request_id": req_id,
                    "vendor_id": vendor["vendor_id"],
                    "bid_price": round(bid_price, 2),
                    "bid_timestamp": bid_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "is_fraudulent_flag": 0,
                    "collusion_group": None
                })
                bid_id_counter += 1
                
    bids_df = pd.DataFrame(bids)
    bids_df.to_csv(os.path.join(DATA_DIR, "bids.csv"), index=False)
    print("Saved bids.csv")
    
    fraud_df = pd.DataFrame(fraud_alerts)
    fraud_df.to_csv(os.path.join(DATA_DIR, "fraud_alerts.csv"), index=False)
    print("Saved fraud_alerts.csv")
    return bids, fraud_alerts

def generate_audit_trail(bids, requests):
    print("Generating cryptographic audit trail...")
    audit_logs = []
    
    events = []
    for req in requests:
        events.append({
            "timestamp": req["created_at"],
            "action": "PROCUREMENT_REQUEST_CREATED",
            "payload": json.dumps({"request_id": req["request_id"], "title": req["title"], "max_budget": req["max_budget"]})
        })
        
    for bid in bids:
        events.append({
            "timestamp": bid["bid_timestamp"],
            "action": "BID_SUBMITTED",
            "payload": json.dumps({"bid_id": bid["bid_id"], "request_id": bid["request_id"], "vendor_id": bid["vendor_id"], "price": bid["bid_price"]})
        })
        
    events.sort(key=lambda x: x["timestamp"])
    
    previous_hash = "0" * 64
    for idx, event in enumerate(events):
        log_id = f"AUD-{idx+1:06d}"
        data_to_hash = f"{log_id}|{event['timestamp']}|{event['action']}|{event['payload']}|{previous_hash}"
        current_hash = hashlib.sha256(data_to_hash.encode("utf-8")).hexdigest()
        
        audit_logs.append({
            "log_id": log_id,
            "timestamp": event["timestamp"],
            "action": event["action"],
            "payload": event["payload"],
            "previous_hash": previous_hash,
            "hash": current_hash
        })
        previous_hash = current_hash
        
    audit_df = pd.DataFrame(audit_logs)
    audit_df.to_csv(os.path.join(DATA_DIR, "audit_trail.csv"), index=False)
    print("Saved audit_trail.csv")
    return audit_logs

def create_unified_procurement_history(vendors, requests, bids):
    print("Creating unified procurement history dataset for ML modeling...")
    # Convert lists of dicts to DataFrames if they aren't already
    v_df = pd.DataFrame(vendors)
    r_df = pd.DataFrame(requests)
    b_df = pd.DataFrame(bids)
    
    # Identify the lowest bid (winner) for each request
    lowest_bids = b_df[b_df["is_fraudulent_flag"] == 0].loc[
        b_df[b_df["is_fraudulent_flag"] == 0].groupby("request_id")["bid_price"].idxmin()
    ]
    
    # Merge requests with winning bid information and vendor profile
    history_df = lowest_bids.merge(r_df, on="request_id")
    history_df = history_df.merge(v_df, on="vendor_id")
    
    # Calculate performance features for ML target
    # Utility Score = 0.4 * (1 - bid_price/max_budget) + 0.3 * reliability_score + 0.2 * (1 - delay/15) + 0.1 * (1 - defect_rate)
    price_ratio = history_df["bid_price"] / history_df["max_budget"]
    rel_score = history_df["reliability_score"]
    delay_norm = 1.0 - (history_df["avg_delay_days"].clip(0, 15) / 15.0)
    defect_norm = 1.0 - history_df["defect_rate"]
    
    utility_score = (0.4 * (1.0 - price_ratio) + 
                     0.3 * rel_score + 
                     0.2 * delay_norm + 
                     0.1 * defect_norm)
    
    # Map utility score to a success rank / recommendation score (0 - 100)
    history_df["ai_recommendation_score"] = np.round(utility_score * 100, 1)
    
    # Keep only target model fields
    model_dataset = history_df[[
        "request_id", "title", "category_x", "max_budget", "quantity",
        "vendor_id", "name", "bid_price", "historical_rating", 
        "reliability_score", "avg_delay_days", "defect_rate", 
        "historical_completion_rate", "ai_recommendation_score"
    ]].rename(columns={"category_x": "category"})
    
    model_dataset.to_csv(os.path.join(DATA_DIR, "procurement_history.csv"), index=False)
    print("Saved consolidated procurement_history.csv")

if __name__ == "__main__":
    vendors = generate_vendors()
    requests = generate_procurement_requests()
    bids, fraud = generate_bids_and_fraud(vendors, requests)
    generate_audit_trail(bids, requests)
    create_unified_procurement_history(vendors, requests, bids)
    print("Synthetic dataset successfully updated to meet full specifications!")
