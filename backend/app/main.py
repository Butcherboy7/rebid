import os
import sys
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add project root to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from ml.predict import ai_engine
from backend.app.services import audit_engine, fraud_engine, generate_invoice_pdf

app = FastAPI(title="ReBid AI - Enterprise Reverse Procurement API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory for PDFs
static_pdf_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_pdf_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_pdf_dir), name="static")

# In-Memory State for Instant Demo Responsiveness
STATE = {
    "users": [
        {"id": "u1", "email": "buyer@rebid.ai", "role": "BUYER", "name": "Enterprise Buyer Corp"},
        {"id": "u2", "email": "vendor@rebid.ai", "role": "VENDOR", "name": "HP Enterprise Solutions", "domain": "IT Hardware", "verified": True, "rating": 4.9, "reliability": 0.96, "delivery": 95.0},
        {"id": "u3", "email": "vendor2@rebid.ai", "role": "VENDOR", "name": "Dell Global Logistics", "domain": "IT Hardware", "verified": True, "rating": 4.7, "reliability": 0.91, "delivery": 91.0},
        {"id": "u4", "email": "admin@rebid.ai", "role": "ADMIN", "name": "Compliance Admin"}
    ],
    "pending_vendors": [
        {"id": "v_pend_1", "company": "ABC Infra Pvt Ltd", "domain": "Construction & Infrastructure", "email": "contact@abcinfra.com", "submitted_at": "2026-08-04 08:30"},
        {"id": "v_pend_2", "company": "Apex Freight Logistics", "domain": "Logistics & Freight", "email": "info@apexfreight.com", "submitted_at": "2026-08-04 09:15"}
    ],
    "verified_vendors": [
        {"id": "VND-0001", "name": "HP Enterprise", "domain": "IT Hardware", "rating": 4.9, "reliability": 0.96, "delivery": 95.0, "reviews": [{"author": "Google", "text": "Excellent supplier, always on time."}, {"author": "Infosys", "text": "Top hardware tier."}]},
        {"id": "VND-0002", "name": "Dell Technologies", "domain": "IT Hardware", "rating": 4.7, "reliability": 0.92, "delivery": 92.0, "reviews": [{"author": "Wipro", "text": "Competitive pricing and reliable."}]},
        {"id": "VND-0003", "name": "Lenovo Enterprise", "domain": "IT Hardware", "rating": 4.6, "reliability": 0.88, "delivery": 89.0, "reviews": [{"author": "TCS", "text": "Good bulk delivery track record."}]},
        {"id": "VND-0004", "name": "Global Cargo Freight", "domain": "Logistics & Freight", "rating": 4.8, "reliability": 0.94, "delivery": 94.0, "reviews": [{"author": "Amazon", "text": "Seamless shipping SLA."}]}
    ],
    "auctions": [
        {
            "id": "AUC-0001",
            "title": "Enterprise Laptops & Server Infrastructure Fleet",
            "domain": "IT Hardware",
            "max_budget": 50000.0,
            "status": "LIVE",
            "weight_cost": 40,
            "weight_reliability": 30,
            "weight_delivery": 20,
            "weight_reviews": 10,
            "time_remaining_seconds": 300,
            "created_at": "2026-08-04T09:00:00"
        }
    ],
    "bids": [
        {"id": "b1", "auction_id": "AUC-0001", "vendor_id": "VND-0003", "name": "Lenovo Enterprise", "price": 47500.0, "timestamp": "2026-08-04T09:02:10"},
        {"id": "b2", "auction_id": "AUC-0001", "vendor_id": "VND-0002", "name": "Dell Technologies", "price": 47300.0, "timestamp": "2026-08-04T09:03:40"},
        {"id": "b3", "auction_id": "AUC-0001", "vendor_id": "VND-0001", "name": "HP Enterprise", "price": 47200.0, "timestamp": "2026-08-04T09:04:15"}
    ],
    "fraud_alerts": []
}

# Models
class CreateAuctionRequest(BaseModel):
    title: str
    domain: str
    max_budget: float
    duration_minutes: int = 5
    weight_cost: int = 40
    weight_reliability: int = 30
    weight_delivery: int = 20
    weight_reviews: int = 10

class SubmitBidRequest(BaseModel):
    auction_id: str
    vendor_id: str
    vendor_name: str
    price: float

class AwardAuctionRequest(BaseModel):
    auction_id: str
    vendor_id: str
    vendor_name: str
    amount: float

# Routes

@app.get("/api/state")
def get_full_state():
    return {
        "auctions": STATE["auctions"],
        "bids": STATE["bids"],
        "verified_vendors": STATE["verified_vendors"],
        "pending_vendors": STATE["pending_vendors"],
        "fraud_alerts": STATE["fraud_alerts"],
        "audit_logs": audit_engine.get_logs()[:20]
    }

@app.post("/api/auctions")
def create_auction(req: CreateAuctionRequest):
    auc_id = f"AUC-{len(STATE['auctions'])+1:04d}"
    auction = {
        "id": auc_id,
        "title": req.title,
        "domain": req.domain,
        "max_budget": req.max_budget,
        "status": "LIVE",
        "weight_cost": req.weight_cost,
        "weight_reliability": req.weight_reliability,
        "weight_delivery": req.weight_delivery,
        "weight_reviews": req.weight_reviews,
        "time_remaining_seconds": req.duration_minutes * 60,
        "created_at": datetime.now().isoformat()
    }
    STATE["auctions"].insert(0, auction)
    audit_engine.add_event("AUCTION_CREATED", "Buyer", {"auction_id": auc_id, "title": req.title, "budget": req.max_budget})
    return {"status": "success", "auction": auction}

@app.post("/api/bids")
def submit_bid(req: SubmitBidRequest):
    bid_id = f"BID-{len(STATE['bids'])+1:05d}"
    now_str = datetime.now().isoformat()
    bid = {
        "id": bid_id,
        "auction_id": req.auction_id,
        "vendor_id": req.vendor_id,
        "name": req.vendor_name,
        "price": req.price,
        "timestamp": now_str
    }
    STATE["bids"].append(bid)
    
    # Audit log
    audit_engine.add_event("BID_SUBMITTED", req.vendor_name, {"auction_id": req.auction_id, "price": req.price})

    # Fraud analysis
    auc_bids = [b for b in STATE["bids"] if b["auction_id"] == req.auction_id]
    alerts = fraud_engine.analyze_bids(auc_bids)
    if alerts:
        for a in alerts:
            a["id"] = f"FRD-{len(STATE['fraud_alerts'])+1:03d}"
            a["auction_id"] = req.auction_id,
            a["vendor_id"] = req.vendor_id,
            a["timestamp"] = now_str
            STATE["fraud_alerts"].insert(0, a)
            audit_engine.add_event("FRAUD_ALERT_FLAGGED", "System", a)

    return {"status": "success", "bid": bid, "alerts_detected": len(alerts)}

@app.get("/api/ai/recommendation/{auction_id}")
def get_ai_recommendation(auction_id: str):
    auc = next((a for a in STATE["auctions"] if a["id"] == auction_id), None)
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")

    auc_bids = [b for b in STATE["bids"] if b["auction_id"] == auction_id]
    if not auc_bids:
        return {"recommendations": [], "winner": None}

    # Enrich bids with vendor profile details
    enriched_bids = []
    for b in auc_bids:
        v_profile = next((v for v in STATE["verified_vendors"] if v["name"] == b["name"] or v["id"] == b["vendor_id"]), None)
        enriched_bids.append({
            "vendor_id": b["vendor_id"],
            "name": b["name"],
            "price": b["price"],
            "reliability_score": v_profile["reliability"] if v_profile else 0.90,
            "delivery_score": v_profile["delivery"] if v_profile else 92.0,
            "historical_rating": v_profile["rating"] if v_profile else 4.5,
            "defect_rate": 0.01,
            "avg_delay_days": 1.0,
            "completed_contracts": 120
        })

    weights = {
        "cost": auc["weight_cost"],
        "reliability": auc["weight_reliability"],
        "delivery": auc["weight_delivery"],
        "reviews": auc["weight_reviews"]
    }

    evaluations = ai_engine.evaluate_vendors(auc["max_budget"], enriched_bids, weights)
    winner = evaluations[0] if evaluations else None

    return {
        "auction_id": auction_id,
        "recommendations": evaluations,
        "winner": winner
    }

@app.post("/api/award")
def award_contract(req: AwardAuctionRequest):
    auc = next((a for a in STATE["auctions"] if a["id"] == req.auction_id), None)
    if auc:
        auc["status"] = "COMPLETED"

    pdf_url = generate_invoice_pdf(req.auction_id, "Enterprise Buyer Corp", req.vendor_name, auc["title"] if auc else "Procurement Order", req.amount)
    
    audit_engine.add_event("CONTRACT_AWARDED", "Buyer", {"auction_id": req.auction_id, "winner": req.vendor_name, "amount": req.amount, "pdf": pdf_url})

    return {
        "status": "success",
        "message": f"Contract awarded to {req.vendor_name}!",
        "pdf_url": pdf_url
    }

@app.post("/api/admin/verify_vendor/{vendor_id}")
def verify_vendor(vendor_id: str, approve: bool = True):
    v = next((item for item in STATE["pending_vendors"] if item["id"] == vendor_id), None)
    if v:
        STATE["pending_vendors"].remove(v)
        if approve:
            new_v = {
                "id": f"VND-{len(STATE['verified_vendors'])+1:04d}",
                "name": v["company"],
                "domain": v["domain"],
                "rating": 4.8,
                "reliability": 0.92,
                "delivery": 93.0,
                "reviews": [{"author": "System", "text": "Newly verified vendor."}]
            }
            STATE["verified_vendors"].append(new_v)
            audit_engine.add_event("VENDOR_VERIFIED", "Admin", {"vendor": v["company"]})
            return {"status": "success", "message": f"Vendor {v['company']} approved!"}
    return {"status": "success", "message": "Vendor rejected"}
