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

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "csv")
os.makedirs(DATA_DIR, exist_ok=True)

DOMAINS = [
    "IT Hardware", 
    "Software & Cloud Services", 
    "Logistics & Freight", 
    "Raw Materials & Metals", 
    "Construction & Infrastructure", 
    "Healthcare & Medical Supplies", 
    "Manufacturing & Heavy Machinery"
]

def generate_10k_dataset():
    print("Generating 10,000 synthetic procurement and bidding records across 7 core domains...")
    
    # 1. Generate 800 Vendors
    vendors = []
    for i in range(1, 801):
        base_quality = np.random.uniform(0.5, 1.0)
        rating = np.round(2.5 + 2.5 * base_quality, 2)
        reliability = np.round(base_quality, 3)
        delivery_score = np.round(np.random.uniform(70, 99) * base_quality + random.uniform(0, 10), 1)
        delivery_score = min(100.0, max(50.0, delivery_score))
        avg_delay_days = np.round(max(0.1, (100.0 - delivery_score) * 0.3), 1)
        defect_rate = np.round(max(0.001, (1.0 - base_quality) * 0.06), 4)
        completed_contracts = random.randint(15, 300)
        cancellation_rate = np.round(random.uniform(0.01, 0.08) * (1.1 - base_quality), 3)
        verified = 1 if base_quality > 0.65 else 0

        vendors.append({
            "vendor_id": f"VND-{i:04d}",
            "name": fake.company(),
            "domain": random.choice(DOMAINS),
            "historical_rating": rating,
            "reliability_score": reliability,
            "delivery_score": delivery_score,
            "avg_delay_days": avg_delay_days,
            "defect_rate": defect_rate,
            "completed_contracts": completed_contracts,
            "cancellation_rate": cancellation_rate,
            "verified": verified
        })
    v_df = pd.DataFrame(vendors)
    v_df.to_csv(os.path.join(DATA_DIR, "vendors.csv"), index=False)
    print(f"Generated {len(v_df)} vendors.")

    # 2. Generate 1,500 Procurement Requests / Auctions
    requests = []
    base_date = datetime(2026, 1, 1)
    for i in range(1, 1501):
        domain = random.choice(DOMAINS)
        max_budget = float(np.round(np.random.uniform(10000, 500000), 2))
        w_cost = random.randint(20, 60)
        w_rel = random.randint(10, 40)
        w_del = random.randint(10, 30)
        w_rev = 100 - (w_cost + w_rel + w_del)
        if w_rev < 5:
            w_rev = 10
            w_cost -= 5

        requests.append({
            "auction_id": f"AUC-{i:04d}",
            "domain": domain,
            "title": f"Procurement Request #{i:04d} - {domain}",
            "max_budget": max_budget,
            "weight_cost": w_cost,
            "weight_reliability": w_rel,
            "weight_delivery": w_del,
            "weight_reviews": w_rev,
            "duration_minutes": random.choice([5, 10, 15, 30]),
            "created_at": (base_date + timedelta(days=random.randint(1, 180))).strftime("%Y-%m-%d %H:%M:%S")
        })
    r_df = pd.DataFrame(requests)
    r_df.to_csv(os.path.join(DATA_DIR, "auctions.csv"), index=False)
    print(f"Generated {len(r_df)} auctions.")

    # 3. Generate 10,000+ Bids
    bids = []
    bid_id = 1
    for req in requests:
        auction_id = req["auction_id"]
        domain = req["domain"]
        budget = req["max_budget"]
        matching = [v for v in vendors if v["domain"] == domain]
        if len(matching) < 3:
            matching = vendors[:10]
        
        num_bidders = random.randint(4, 9)
        bidders = random.sample(matching, min(len(matching), num_bidders))
        
        current_price = budget
        for round_idx in range(random.randint(3, 8)):
            v = random.choice(bidders)
            decrement = current_price * random.uniform(0.01, 0.05)
            current_price = max(budget * 0.4, current_price - decrement)
            
            # Calculate utility score to mark realistic winners
            price_ratio = current_price / budget
            utility = (
                (req["weight_cost"] / 100.0) * (1.0 - price_ratio) +
                (req["weight_reliability"] / 100.0) * v["reliability_score"] +
                (req["weight_delivery"] / 100.0) * (v["delivery_score"] / 100.0) +
                (req["weight_reviews"] / 100.0) * (v["historical_rating"] / 5.0)
            )
            
            bids.append({
                "bid_id": f"BID-{bid_id:06d}",
                "auction_id": auction_id,
                "vendor_id": v["vendor_id"],
                "price": round(current_price, 2),
                "price_ratio": round(price_ratio, 4),
                "reliability_score": v["reliability_score"],
                "delivery_score": v["delivery_score"],
                "historical_rating": v["historical_rating"],
                "defect_rate": v["defect_rate"],
                "avg_delay_days": v["avg_delay_days"],
                "completed_contracts": v["completed_contracts"],
                "utility_score": round(utility, 4),
                "is_fraud": 0,
                "timestamp": req["created_at"]
            })
            bid_id += 1

    b_df = pd.DataFrame(bids)

    # Determine winners (highest utility score per auction)
    idx_winners = b_df.groupby("auction_id")["utility_score"].idxmax()
    b_df["is_winner"] = 0
    b_df.loc[idx_winners, "is_winner"] = 1

    b_df.to_csv(os.path.join(DATA_DIR, "dataset_10k.csv"), index=False)
    print(f"Successfully generated dataset_10k.csv with {len(b_df)} rows!")

if __name__ == "__main__":
    generate_10k_dataset()
