import os
import sys
import csv
import random
import datetime
import uuid
import shutil
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.app.database import engine, Base, get_db
from backend.app.models import User, Vendor, Auction, Bid, AuditLog, FraudAlert, PurchaseOrder, UserDocument, VerificationToken
from backend.app.schemas import (
    LoginRequest, ResetPasswordRequest, TokenResponse, CreateAuctionRequest, SubmitBidRequest,
    AwardContractRequest, RecommendationResponse
)
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from backend.app.services import log_audit_event, analyze_bid_fraud, generate_purchase_order_pdf, format_inr
from ml.predict import ai_engine
from backend.app.routes.auth import router as auth_router
from backend.app.routes.admin_docs import router as admin_docs_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReBid AI - Enterprise Reverse Procurement System API", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_docs_router)

static_pdf_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_pdf_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_pdf_dir), name="static")

uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"http://localhost:8001/uploads/{unique_filename}"
        
        return {
            "status": "success",
            "filename": file.filename,
            "url": file_url,
            "size": os.path.getsize(file_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# Helper: Seed initial 1 single bid for auction start
def seed_initial_auction_bids(db: Session, auction_id: str, category: str, max_budget: float):
    category_vendors = db.query(Vendor).filter(Vendor.category == category).all()
    if not category_vendors:
        category_vendors = db.query(Vendor).filter(Vendor.verified == True).limit(3).all()

    if not category_vendors:
        return

    # Seed initial anchor bid from 1 vendor
    vendor = category_vendors[0]
    bid_price = round(max_budget * 0.96, 2)
    bid_id = f"BID-00001-{uuid.uuid4().hex[:4]}"
    db.add(Bid(
        id=bid_id,
        auction_id=auction_id,
        vendor_id=vendor.id,
        vendor_name=vendor.name,
        price=bid_price,
        timestamp=datetime.datetime.utcnow()
    ))
    db.commit()


# Startup Event: Seed Demo Accounts, Vendors & Dataset
@app.on_event("startup")
def startup_seed_db():
    from backend.app.database import SessionLocal
    db = SessionLocal()
    try:
        # 1. Seed Enterprise Users (Buyer, Admin, and 10 Industry Vendors)
        demo_accounts = [
            {"id": "usr_buyer", "email": "buyer@rebid.ai", "name": "Enterprise Procurement Corp", "role": "BUYER"},
            {"id": "usr_admin", "email": "admin@rebid.ai", "name": "Compliance Administrator", "role": "ADMIN"},
            # 10 Industry Vendor Users
            {"id": "usr_hp", "email": "vendor1@rebid.ai", "name": "HP Enterprise Solutions", "role": "VENDOR", "category": "IT Hardware", "rel": 0.96, "del": 95.0, "rating": 4.9},
            {"id": "usr_dell", "email": "vendor2@rebid.ai", "name": "Dell Technologies", "role": "VENDOR", "category": "IT Hardware", "rel": 0.92, "del": 91.0, "rating": 4.7},
            {"id": "usr_lenovo", "email": "lenovo@rebid.ai", "name": "Lenovo Business", "role": "VENDOR", "category": "IT Hardware", "rel": 0.89, "del": 88.0, "rating": 4.6},
            {"id": "usr_acer", "email": "acer@rebid.ai", "name": "Acer Commercial", "role": "VENDOR", "category": "IT Hardware", "rel": 0.86, "del": 87.0, "rating": 4.4},
            {"id": "usr_tata", "email": "tatasteel@rebid.ai", "name": "Tata Steel Ltd", "role": "VENDOR", "category": "Raw Materials & Metals", "rel": 0.95, "del": 94.0, "rating": 4.9},
            {"id": "usr_jsw", "email": "jswsteel@rebid.ai", "name": "JSW Steel Infra", "role": "VENDOR", "category": "Raw Materials & Metals", "rel": 0.91, "del": 90.0, "rating": 4.7},
            {"id": "usr_lt", "email": "ltconst@rebid.ai", "name": "L&T Construction", "role": "VENDOR", "category": "Construction & Infrastructure", "rel": 0.94, "del": 93.0, "rating": 4.8},
            {"id": "usr_bluedart", "email": "bluedart@rebid.ai", "name": "Blue Dart Logistics", "role": "VENDOR", "category": "Logistics & Freight", "rel": 0.93, "del": 96.0, "rating": 4.8},
            {"id": "usr_dhl", "email": "dhl@rebid.ai", "name": "DHL Supply Chain", "role": "VENDOR", "category": "Logistics & Freight", "rel": 0.90, "del": 92.0, "rating": 4.6},
            {"id": "usr_amazon", "email": "amazon@rebid.ai", "name": "Amazon Business Services", "role": "VENDOR", "category": "Software & Cloud Services", "rel": 0.97, "del": 97.0, "rating": 4.9}
        ]

        for acc in demo_accounts:
            existing_user = db.query(User).filter(User.email == acc["email"]).first()
            if not existing_user:
                db.add(User(
                    id=acc["id"],
                    email=acc["email"],
                    password_hash=hash_password("password123"),
                    role=acc["role"],
                    name=acc["name"],
                    email_verified=True,
                    status="approved"
                ))
                db.commit()

            # Seed vendor profile if vendor
            if acc["role"] == "VENDOR":
                v_id = f"VND-{acc['id'].upper().replace('USR_', '')}"
                existing_vendor = db.query(Vendor).filter(Vendor.id == v_id).first()
                if not existing_vendor:
                    db.add(Vendor(
                        id=v_id,
                        user_id=acc["id"],
                        name=acc["name"],
                        company_name=acc["name"],
                        category=acc.get("category", "IT Hardware"),
                        verified=True,
                        rating=acc.get("rating", 4.5),
                        reliability_score=acc.get("rel", 0.90),
                        delivery_score=acc.get("del", 90.0),
                        contracts_completed=random.randint(60, 200),
                        cancellation_rate=0.01,
                        avg_delay_days=0.8,
                        defect_rate=0.008
                    ))
                    db.commit()

        # 2. Seed 500+ Vendor Dataset from data/csv/vendors.csv
        current_vendor_count = db.query(Vendor).count()
        csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "csv", "vendors.csv")
        if current_vendor_count < 50 and os.path.exists(csv_path):
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    v_id = row.get("vendor_id", f"VND-{db.query(Vendor).count()+1:04d}")
                    if not db.query(Vendor).filter(Vendor.id == v_id).first():
                        db.add(Vendor(
                            id=v_id,
                            user_id=None,
                            name=row.get("name", "Vendor"),
                            company_name=row.get("name", "Vendor"),
                            category=row.get("domain", "IT Hardware"),
                            verified=bool(int(row.get("verified", 1))),
                            rating=float(row.get("historical_rating", 4.5)),
                            reliability_score=float(row.get("reliability_score", 0.85)),
                            delivery_score=float(row.get("delivery_score", 85.0)),
                            contracts_completed=int(row.get("completed_contracts", 50)),
                            cancellation_rate=float(row.get("cancellation_rate", 0.02)),
                            avg_delay_days=float(row.get("avg_delay_days", 1.0)),
                            defect_rate=float(row.get("defect_rate", 0.01))
                        ))
            db.commit()

        # 3. Seed Demo Live Auction AUC-0001
        auc_existing = db.query(Auction).filter(Auction.id == "AUC-0001").first()
        if not auc_existing:
            ends = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
            demo_auc = Auction(
                id="AUC-0001",
                title="Enterprise Laptop Fleet & Server Infrastructure",
                category="IT Hardware",
                max_budget=5000000.0, # ₹50,00,000 INR
                status="live",
                weight_cost=40,
                weight_reliability=30,
                weight_delivery=20,
                weight_reviews=10,
                buyer_id="usr_buyer",
                ends_at=ends
            )
            db.add(demo_auc)
            db.commit()

            seed_initial_auction_bids(db, "AUC-0001", "IT Hardware", 5000000.0)
            log_audit_event(db, "AUCTION_CREATED", "Enterprise Procurement Corp", {"auction_id": "AUC-0001", "title": demo_auc.title})

    except Exception as e:
        print(f"[Startup Error] Database seeding exception: {e}")
    finally:
        db.close()


# ----------------------------------------------------
# AUTHENTICATION ENDPOINTS (Three Logins + Password Reset)
# ----------------------------------------------------

def _login_user(db: Session, req: LoginRequest, expected_role: str):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.role != expected_role:
        raise HTTPException(status_code=403, detail=f"User role is {user.role}, not authorized for {expected_role} portal")
    
    if user.status != "approved":
        status_messages = {
            "pending_verification": "Please verify your email address first",
            "pending_documents": "Please complete document upload",
            "pending_approval": "Your account is under admin review",
            "amendment_required": "Some documents require re-upload",
            "rejected": "Your account has been rejected"
        }
        raise HTTPException(status_code=403, detail=status_messages.get(user.status, f"Account status: {user.status}"))

    vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first()
    token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "name": user.name,
        "vendor_id": vendor.id if vendor else None
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        status=user.status,
        name=user.name,
        email=user.email,
        vendor_id=vendor.id if vendor else None
    )

@app.post("/api/buyer/login", response_model=TokenResponse)
def buyer_login(req: LoginRequest, db: Session = Depends(get_db)):
    return _login_user(db, req, "BUYER")

@app.post("/api/vendor/login", response_model=TokenResponse)
def vendor_login(req: LoginRequest, db: Session = Depends(get_db)):
    return _login_user(db, req, "VENDOR")

@app.post("/api/admin/login", response_model=TokenResponse)
def admin_login(req: LoginRequest, db: Session = Depends(get_db)):
    return _login_user(db, req, "ADMIN")

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found with provided email address")

    user.password_hash = hash_password(req.new_password)
    db.commit()

    log_audit_event(db, "PASSWORD_RESET", user.name, {"email": user.email})
    return {"status": "success", "message": f"Password for {req.email} reset successfully!"}


# ----------------------------------------------------
# REALISTIC GRADUAL BOT BIDDING SIMULATION ENGINE
# ----------------------------------------------------

def trigger_autonomous_bot_bids(db: Session, auction: Auction):
    """Simulates realistic staggered vendor joins and profile-driven counter-bids."""
    if auction.status != "live":
        return

    import random as rand
    rand_val = rand.random()
    
    if rand_val > 0.15:
        return
    
    num_bots = 1 if rand_val > 0.03 else 2

    bids = db.query(Bid).filter(Bid.auction_id == auction.id).order_by(Bid.price.asc()).all()
    if len(bids) >= 20:
        return
        
    lowest_bid_price = bids[0].price if bids else auction.max_budget
    lowest_vendor_id = bids[0].vendor_id if bids else None

    category_vendors = db.query(Vendor).filter(Vendor.category == auction.category).all()
    if not category_vendors:
        category_vendors = db.query(Vendor).filter(Vendor.verified == True).limit(6).all()

    if not category_vendors:
        return

    eligible_vendors = [v for v in category_vendors if v.id != lowest_vendor_id]
    if not eligible_vendors:
        eligible_vendors = category_vendors

    for _ in range(num_bots):
        bot_vendor = rand.choice(eligible_vendors)

        if bot_vendor.rating >= 4.8:
            min_floor = round(0.80 * auction.max_budget, 2)
        else:
            min_floor = round(0.50 * auction.max_budget, 2)

        decrement = rand.randint(15000, 45000)
        new_price = round(lowest_bid_price - decrement, 2)

        if new_price < min_floor:
            continue

        bid_id = f"BID-{db.query(Bid).count() + 1:05d}-{uuid.uuid4().hex[:4]}"
        bot_bid = Bid(
            id=bid_id,
            auction_id=auction.id,
            vendor_id=bot_vendor.id,
            vendor_name=bot_vendor.name,
            price=new_price,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(bot_bid)
        db.commit()

        log_audit_event(db, "BID_SUBMITTED", f"{bot_vendor.name} [Bot]", {"auction_id": auction.id, "price": new_price})
        lowest_bid_price = new_price


# ----------------------------------------------------
# ENRICHED VENDOR PROFILE & REVIEWS ENDPOINT
# ----------------------------------------------------

@app.get("/api/vendors/{vendor_identifier}/profile")
def get_vendor_profile(vendor_identifier: str, db: Session = Depends(get_db)):
    """Retrieves state-aware vendor profile."""
    vendor = db.query(Vendor).filter((Vendor.id == vendor_identifier) | (Vendor.name == vendor_identifier) | (Vendor.company_name == vendor_identifier)).first()
    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor profile not found for '{vendor_identifier}'")

    user = db.query(User).filter(User.id == vendor.user_id).first() if vendor.user_id else None
    vendor_status = user.status if user else "unknown"
    is_verified_vendor = vendor.verified and vendor_status == "approved"

    if not is_verified_vendor:
        documents = []
        if user and vendor.user_id:
            docs = db.query(UserDocument).filter(UserDocument.user_id == vendor.user_id).all()
            for d in docs:
                documents.append({
                    "id": d.id,
                    "doc_type": d.doc_type,
                    "file_url": d.file_url,
                    "status": d.status,
                    "rejection_reason": d.rejection_reason,
                    "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
                })

        return {
            "id": vendor.id,
            "user_id": vendor.user_id,
            "name": vendor.name,
            "company_name": vendor.company_name,
            "category": vendor.category,
            "verified": vendor.verified,
            "status": vendor_status,
            "documents": documents,
            "is_approved": False,
            "message": "This vendor application is under review or not yet approved" if vendor_status != "rejected" else "This vendor application was rejected"
        }

    rel_pct = int(vendor.reliability_score * 100) if vendor.reliability_score else 90
    del_pct = int(vendor.delivery_score) if vendor.delivery_score else 90
    rating = round(vendor.rating, 1) if vendor.rating else 4.5

    # Check actual awarded contracts for this vendor
    actual_pos = db.query(PurchaseOrder).filter((PurchaseOrder.vendor_name == vendor.name) | (PurchaseOrder.vendor_name == vendor.company_name)).all()

    is_real_vendor = vendor.user_id is not None or vendor.contracts_completed == 0

    if is_real_vendor:
        completed_contracts = len(actual_pos)
        total_procurement_val = sum(p.amount for p in actual_pos)
        
        if completed_contracts == 0:
            reviews = []
            history = []
            monthly_contracts = [0, 0, 0, 0, 0, 0]
            monthly_win_rates = [0, 0, 0, 0, 0, 0]
        else:
            reviews = []
            history = []
            for i, p in enumerate(actual_pos):
                history.append({
                    "id": p.id,
                    "buyer_name": p.buyer_name,
                    "category": vendor.category,
                    "contract_value": p.amount,
                    "status": "ACTIVE" if i == 0 else "COMPLETED",
                    "rating": 5.0,
                    "date": p.created_at.strftime("%b %Y") if p.created_at else "Recent"
                })
            monthly_contracts = [0, 0, 0, 0, 0, completed_contracts]
            monthly_win_rates = [0, 0, 0, 0, 0, 100]
    else:
        completed_contracts = vendor.contracts_completed or 50
        total_procurement_val = completed_contracts * random.randint(3500000, 7500000)

        buyer_companies = [
            ("Malla Reddy University", "Mark Stevenson", "VP Supply Chain"),
            ("Tata Enterprises Corp", "Rajesh Sharma", "Head of Procurement"),
            ("Apex Cloud Infrastructure", "Sarah Jenkins", "Senior Buyer"),
            ("Metro Tech Solutions", "David Miller", "Infrastructure Lead"),
            ("Orion Industrial Corp", "Elena Rostova", "Operations Director")
        ]

        reviews = []
        days_ago = [4, 18, 35, 62, 90]

        for idx, (b_comp, reviewer, title) in enumerate(buyer_companies):
            r_date = (datetime.datetime.utcnow() - datetime.timedelta(days=days_ago[idx])).strftime("%B %d, %Y")
            
            if rel_pct >= 92 and rating >= 4.7:
                stars = 5
                text = f"Exceptional partner! Delivered all equipment with {del_pct}% SLA compliance. Zero defects reported across {format_inr(random.randint(4500000,9000000))} contract value."
            elif rel_pct >= 85:
                stars = 4
                text = f"Very solid execution by {vendor.name}. Delivery was completed within {vendor.avg_delay_days:.1f} days margin. Professional communication throughout."
            else:
                stars = 3 if idx % 2 == 0 else 4
                text = f"Acceptable delivery quality, though experienced minor scheduling delays ({vendor.avg_delay_days:.1f} days). Pricing remains competitive."

            reviews.append({
                "id": f"REV-{vendor.id}-{idx+1}",
                "buyer_company": b_comp,
                "reviewer_name": reviewer,
                "reviewer_title": title,
                "stars": stars,
                "review_text": text,
                "date": r_date,
                "verified": True
            })

        categories_list = [vendor.category, "IT Infrastructure", "Commercial Fleet", "SaaS Licensing"]
        history = []
        for i in range(5):
            h_val = random.randint(2500000, 9500000)
            h_date = (datetime.datetime.utcnow() - datetime.timedelta(days=(i+1)*28)).strftime("%b %Y")
            history.append({
                "id": f"PO-HIST-{vendor.id[:4]}-{i+1:03d}",
                "buyer_name": buyer_companies[i % len(buyer_companies)][0],
                "category": categories_list[i % len(categories_list)],
                "contract_value": h_val,
                "status": "COMPLETED",
                "rating": round(min(5.0, rating + random.uniform(-0.2, 0.2)), 1),
                "date": h_date
            })

        monthly_contracts = [random.randint(4, 12) for _ in range(6)]
        monthly_win_rates = [random.randint(65, 92) for _ in range(6)]

    if vendor.cancellation_rate > 0.05 or rel_pct < 80:
        risk_level = "HIGH"
    elif vendor.cancellation_rate > 0.02 or rel_pct < 88:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    ai_score = round((0.40 * 92) + (0.30 * rel_pct) + (0.20 * del_pct) + (0.10 * (rating * 20)), 1)
    years_on_platform = max(1, min(5, (hash(vendor.id) % 6) + 1))

    return {
        "id": vendor.id,
        "name": vendor.name,
        "company_name": vendor.company_name,
        "category": vendor.category,
        "verified": vendor.verified,
        "rating": rating,
        "reliability_score": vendor.reliability_score,
        "delivery_score": vendor.delivery_score,
        "contracts_completed": completed_contracts,
        "cancellation_rate": vendor.cancellation_rate,
        "avg_delay_days": vendor.avg_delay_days,
        "defect_rate": vendor.defect_rate,
        "risk_level": risk_level,
        "ai_score": ai_score,
        "years_on_platform": years_on_platform,
        "total_procurement_val": total_procurement_val,
        "reliability_pct": rel_pct,
        "delivery_pct": del_pct,
        "reviews": reviews,
        "history": history,
        "chart_data": {
            "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "monthly_contracts": monthly_contracts,
            "monthly_win_rates": monthly_win_rates
        },
        "ai_breakdown": {
            "price_score": 92,
            "reliability_score": rel_pct,
            "delivery_score": del_pct,
            "history_score": int(rating * 20),
            "overall_ai_score": ai_score
        },
        "is_approved": True,
        "status": "approved"
    }


# ----------------------------------------------------
# AUCTION & BID ENDPOINTS (Polling Leaderboard & Live Feed)
# ----------------------------------------------------

@app.get("/api/auctions")
def list_auctions(category: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Auction)
    if category:
        query = query.filter(Auction.category == category)
    if status and status.lower() != "all":
        query = query.filter(Auction.status == status.lower())

    auctions = query.order_by(Auction.created_at.desc()).all()
    
    res = []
    for a in auctions:
        bids = db.query(Bid).filter(Bid.auction_id == a.id).order_by(Bid.price.asc()).all()
        lowest_bid = bids[0].price if bids else a.max_budget
        res.append({
            "id": a.id,
            "title": a.title,
            "category": a.category,
            "max_budget": a.max_budget,
            "status": a.status,
            "lowest_bid": lowest_bid,
            "bid_count": len(bids),
            "ends_at": a.ends_at.isoformat() if a.ends_at else None,
            "created_at": a.created_at.isoformat()
        })
    return res

@app.post("/api/auctions")
def create_auction(req: CreateAuctionRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["BUYER", "ADMIN"]))):
    auc_id = f"AUC-{db.query(Auction).count() + 1:04d}"
    
    auction = Auction(
        id=auc_id,
        title=req.title,
        category=req.category,
        max_budget=req.max_budget,
        status="pending_approval",
        weight_cost=req.weight_cost,
        weight_reliability=req.weight_reliability,
        weight_delivery=req.weight_delivery,
        weight_reviews=req.weight_reviews,
        buyer_id=current_user.get("user_id"),
        ends_at=None
    )
    db.add(auction)
    db.commit()

    log_audit_event(db, "AUCTION_SUBMITTED_FOR_APPROVAL", current_user.get("name", "Buyer"), {
        "auction_id": auc_id,
        "title": req.title,
        "budget": req.max_budget
    })

    return {
        "status": "pending_approval",
        "auction_id": auc_id,
        "message": "Procurement auction created and submitted to Admin for approval."
    }

@app.get("/api/auctions/{auction_id}")
def get_auction_live(auction_id: str, db: Session = Depends(get_db)):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    now = datetime.datetime.utcnow()
    time_remaining = 0
    if auction.ends_at and auction.ends_at > now:
        time_remaining = int((auction.ends_at - now).total_seconds())
    elif auction.status == "live" and auction.ends_at and auction.ends_at <= now:
        auction.status = "completed"
        db.commit()
        log_audit_event(db, "AUCTION_COMPLETED", "System", {"auction_id": auction_id})

    if auction.status == "live":
        trigger_autonomous_bot_bids(db, auction)

    bids = db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.price.asc(), Bid.timestamp.asc()).all()

    fraud_alerts = db.query(FraudAlert).filter(FraudAlert.auction_id == auction_id).all()
    fraud_map = {f.vendor_id: f.rule_triggered for f in fraud_alerts}

    leaderboard = []
    live_feed = []
    for rank_idx, b in enumerate(bids, start=1):
        fraud_warning = fraud_map.get(b.vendor_id)
        leaderboard.append({
            "rank": rank_idx,
            "bid_id": b.id,
            "vendor_id": b.vendor_id,
            "vendor_name": b.vendor_name,
            "price": b.price,
            "timestamp": b.timestamp.isoformat(),
            "fraud_warning": fraud_warning
        })
        live_feed.append({
            "id": b.id,
            "text": f"{b.vendor_name} placed a bid of {format_inr(b.price)}" if rank_idx > 1 else f"{b.vendor_name} joined and set Rank #1 at {format_inr(b.price)}",
            "timestamp": b.timestamp.strftime("%H:%M:%S"),
            "type": "bid"
        })

    live_feed.reverse()
    lowest_bid = leaderboard[0]["price"] if leaderboard else auction.max_budget

    return {
        "id": auction.id,
        "title": auction.title,
        "category": auction.category,
        "max_budget": auction.max_budget,
        "status": auction.status,
        "time_remaining_seconds": time_remaining,
        "weight_cost": auction.weight_cost,
        "weight_reliability": auction.weight_reliability,
        "weight_delivery": auction.weight_delivery,
        "weight_reviews": auction.weight_reviews,
        "leaderboard": leaderboard,
        "lowest_bid": lowest_bid,
        "total_bids": len(leaderboard),
        "live_feed": live_feed[:10]
    }

@app.post("/api/bids")
def submit_bid(req: SubmitBidRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["VENDOR", "ADMIN"]))):
    auction = db.query(Auction).filter(Auction.id == req.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    if auction.status != "live":
        raise HTTPException(status_code=400, detail=f"Auction is currently {auction.status} and not accepting bids.")

    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.get("user_id")).first()
    vendor_id = vendor.id if vendor else current_user.get("vendor_id", "VND-0001")
    vendor_name = current_user.get("name", "Vendor")

    bid_id = f"BID-{db.query(Bid).count() + 1:05d}-{uuid.uuid4().hex[:4]}"
    new_bid = Bid(
        id=bid_id,
        auction_id=req.auction_id,
        vendor_id=vendor_id,
        vendor_name=vendor_name,
        price=req.price,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(new_bid)
    db.commit()

    log_audit_event(db, "BID_SUBMITTED", vendor_name, {"auction_id": req.auction_id, "price": req.price})
    fraud_alerts = analyze_bid_fraud(db, auction, vendor_id, vendor_name, req.price)

    return {
        "status": "success",
        "bid_id": bid_id,
        "price": req.price,
        "fraud_alerts_triggered": len(fraud_alerts)
    }


# ----------------------------------------------------
# RECOMMENDATION & ENTERPRISE CONTRACT AWARD WORKFLOW
# ----------------------------------------------------

@app.post("/api/recommend/{auction_id}")
def get_ai_recommendation(auction_id: str, db: Session = Depends(get_db)):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    bids = db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.price.asc()).all()
    if not bids:
        return {
            "auction_id": auction_id,
            "recommended_vendor": None,
            "confidence_percentage": 0.0,
            "ranking_list": [],
            "decision_report": None
        }

    vendor_lowest_bids = {}
    for b in bids:
        if b.vendor_id not in vendor_lowest_bids:
            vendor_lowest_bids[b.vendor_id] = b

    enriched_bids = []
    for v_id, b in vendor_lowest_bids.items():
        v_profile = db.query(Vendor).filter(Vendor.id == v_id).first()
        enriched_bids.append({
            "vendor_id": v_id,
            "name": b.vendor_name,
            "price": b.price,
            "reliability_score": v_profile.reliability_score if v_profile else 0.90,
            "delivery_score": v_profile.delivery_score if v_profile else 90.0,
            "rating": v_profile.rating if v_profile else 4.5,
            "defect_rate": v_profile.defect_rate if v_profile else 0.01,
            "avg_delay_days": v_profile.avg_delay_days if v_profile else 1.0,
            "contracts_completed": v_profile.contracts_completed if v_profile else 50
        })

    weights = {
        "cost": auction.weight_cost,
        "reliability": auction.weight_reliability,
        "delivery": auction.weight_delivery,
        "reviews": auction.weight_reviews
    }

    report = ai_engine.evaluate_vendors(auction.max_budget, enriched_bids, weights)
    report["auction_id"] = auction_id

    log_audit_event(db, "AI_RECOMMENDATION_GENERATED", "System AI Engine", {
        "auction_id": auction_id,
        "recommended_vendor": report.get("recommended_vendor"),
        "confidence": report.get("confidence_percentage")
    })

    return report

@app.post("/api/award")
def award_contract(req: AwardContractRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["BUYER", "ADMIN"]))):
    auc = db.query(Auction).filter(Auction.id == req.auction_id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")

    # 1. PERMANENT CONCLUDED STATE: Set auction status to awarded
    auc.status = "awarded"
    db.commit()

    buyer_name = current_user.get("name", "Malla Reddy University")
    po_id = f"PO-2026-{db.query(PurchaseOrder).count() + 1001:06d}"

    # Calculate subtotal, unit price, quantity, and GST (18%)
    quantity = 100
    unit_price = round(req.amount / quantity, 2) if req.amount > quantity else req.amount
    grand_total = req.amount

    # Generate Enterprise SAP/GeM Style Purchase Order PDF
    pdf_url = generate_purchase_order_pdf(
        po_id=po_id,
        buyer_name=buyer_name,
        vendor_name=req.vendor_name,
        item_title=auc.title,
        unit_price=unit_price,
        quantity=quantity,
        category=auc.category,
        auction_id=auc.id
    )

    po = PurchaseOrder(
        id=po_id,
        auction_id=req.auction_id,
        buyer_name=buyer_name,
        vendor_name=req.vendor_name,
        amount=grand_total,
        pdf_url=pdf_url
    )
    db.add(po)
    db.commit()

    # Log Immutable Audit Event
    log_audit_event(db, "CONTRACT_AWARDED", buyer_name, {
        "auction_id": req.auction_id,
        "vendor": req.vendor_name,
        "amount": grand_total,
        "po_id": po_id
    })

    return {
        "status": "success",
        "message": f"Contract successfully awarded to {req.vendor_name}! Official Purchase Order {po_id} issued.",
        "po_id": po_id,
        "pdf_url": pdf_url,
        "awarded_vendor": req.vendor_name,
        "amount": grand_total
    }

@app.get("/api/buyer/awarded_contracts")
def list_buyer_awarded_contracts(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["BUYER", "ADMIN"]))):
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()
    res = []
    for p in pos:
        auc = db.query(Auction).filter(Auction.id == p.auction_id).first()
        res.append({
            "po_id": p.id,
            "auction_id": p.auction_id,
            "title": auc.title if auc else "Procurement Contract",
            "category": auc.category if auc else "IT Equipment",
            "buyer_name": p.buyer_name,
            "vendor_name": p.vendor_name,
            "amount": p.amount,
            "pdf_url": p.pdf_url,
            "created_at": p.created_at.isoformat()
        })
    return res

@app.get("/api/vendor/awarded_contracts")
def list_vendor_awarded_contracts(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["VENDOR", "ADMIN"]))):
    vendor_name = current_user.get("name")
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()
    
    matching_pos = [p for p in pos if p.vendor_name == vendor_name]

    res = []
    for p in matching_pos:
        auc = db.query(Auction).filter(Auction.id == p.auction_id).first()
        res.append({
            "po_id": p.id,
            "auction_id": p.auction_id,
            "title": auc.title if auc else "Procurement Contract",
            "category": auc.category if auc else "IT Equipment",
            "buyer_name": p.buyer_name,
            "vendor_name": p.vendor_name,
            "amount": p.amount,
            "pdf_url": p.pdf_url,
            "delivery_deadline": (p.created_at + datetime.timedelta(days=14)).strftime("%B %d, %Y"),
            "created_at": p.created_at.isoformat()
        })
    return res


# ----------------------------------------------------
# ADMIN PORTAL ENDPOINTS (Approval Workflow + Dataset)
# ----------------------------------------------------

@app.get("/api/admin/pending_auctions")
def list_pending_auctions(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    auctions = db.query(Auction).filter(Auction.status == "pending_approval").order_by(Auction.created_at.desc()).all()
    return [{
        "id": a.id,
        "title": a.title,
        "category": a.category,
        "max_budget": a.max_budget,
        "buyer_id": a.buyer_id,
        "created_at": a.created_at.isoformat()
    } for a in auctions]

@app.post("/api/admin/approve_auction/{auction_id}")
def approve_auction(auction_id: str, approve: bool = True, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    if approve:
        auction.status = "live"
        auction.ends_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        db.commit()

        seed_initial_auction_bids(db, auction.id, auction.category, auction.max_budget)
        log_audit_event(db, "AUCTION_APPROVED_BY_ADMIN", current_user.get("name", "Admin"), {"auction_id": auction_id, "title": auction.title})
        return {"status": "success", "message": f"Auction {auction_id} approved and launched LIVE!"}
    else:
        auction.status = "rejected"
        db.commit()
        log_audit_event(db, "AUCTION_REJECTED_BY_ADMIN", current_user.get("name", "Admin"), {"auction_id": auction_id})
        return {"status": "success", "message": f"Auction {auction_id} rejected by Admin."}

@app.get("/api/admin/users")
def list_users(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "created_at": u.created_at.isoformat()
    } for u in users]

@app.get("/api/admin/vendors")
def list_all_vendors(
    page: int = 1,
    limit: int = 25,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["ADMIN", "BUYER"]))
):
    query = db.query(Vendor)
    if search:
        query = query.filter(Vendor.name.ilike(f"%{search}%") | Vendor.category.ilike(f"%{search}%"))

    total_count = query.count()
    offset = (page - 1) * limit
    vendors = query.offset(offset).limit(limit).all()
    total_pages = (total_count + limit - 1) // limit if limit > 0 else 1

    return {
        "page": page,
        "limit": limit,
        "total_count": total_count,
        "total_pages": total_pages,
        "vendors": [{
            "id": v.id,
            "name": v.name,
            "category": v.category,
            "verified": v.verified,
            "rating": v.rating if v.rating is not None else 4.5,
            "reliability_score": v.reliability_score if v.reliability_score is not None else 0.90,
            "delivery_score": v.delivery_score if v.delivery_score is not None else 90.0,
            "contracts_completed": v.contracts_completed
        } for v in vendors]
    }

@app.get("/api/admin/pending_vendors")
def list_pending_vendors(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    # Query unverified vendors
    vendors = db.query(Vendor).filter(Vendor.verified == False).all()
    
    result = []
    for v in vendors:
        user = db.query(User).filter(User.id == v.user_id).first() if v.user_id else None
        documents = db.query(UserDocument).filter(UserDocument.user_id == v.user_id).all() if v.user_id else []
        
        doc_list = [
            {
                "id": doc.id,
                "doc_type": doc.doc_type,
                "file_url": doc.file_url,
                "status": doc.status,
                "rejection_reason": doc.rejection_reason,
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
            }
            for doc in documents
        ]
        
        # Real users use created_at; synthetic dataset items default to epoch start so real users are top priority
        created_dt = user.created_at if user else datetime.datetime(2026, 1, 1, 0, 0, 0)
        
        result.append({
            "id": v.id,
            "user_id": v.user_id,
            "name": v.name,
            "company_name": v.company_name,
            "category": v.category,
            "email": user.email if user else None,
            "status": user.status if user else "pending_approval",
            "rating": v.rating if v.rating is not None else 4.5,
            "created_at": created_dt.isoformat(),
            "documents": doc_list
        })
    
    # Sort real applicant applications descending by created_at (newest real applicants always first at top)
    result.sort(key=lambda x: (x["user_id"] is not None, x["created_at"]), reverse=True)
    return result

@app.post("/api/admin/verify_vendor/{vendor_id}")
def verify_vendor(vendor_id: str, approve: bool = True, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        # Fallback search by user_id
        vendor = db.query(Vendor).filter(Vendor.user_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    user = db.query(User).filter(User.id == vendor.user_id).first() if vendor.user_id else None

    if approve:
        vendor.verified = True
        if user:
            user.status = "approved"
            user.email_verified = True
            
            # Auto-approve all pending documents for this user
            docs = db.query(UserDocument).filter(UserDocument.user_id == user.id).all()
            for doc in docs:
                if doc.status != "rejected":
                    doc.status = "approved"
                    doc.reviewed_at = datetime.datetime.utcnow()
                    doc.reviewed_by = current_user.get("user_id")

        db.commit()
        log_audit_event(db, "VENDOR_VERIFIED", current_user.get("name", "Admin"), {"vendor_id": vendor.id, "name": vendor.name})
        return {"status": "success", "message": f"Vendor {vendor.name} approved successfully"}
    else:
        if user:
            user.status = "rejected"
        vendor.verified = False
        db.commit()
        log_audit_event(db, "VENDOR_REJECTED", current_user.get("name", "Admin"), {"vendor_id": vendor.id, "name": vendor.name})
        return {"status": "success", "message": "Vendor application rejected"}

@app.get("/api/admin/audit_logs")
def list_audit_logs(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [{
        "id": l.id,
        "action": l.action,
        "actor": l.actor,
        "details": l.details,
        "timestamp": l.timestamp.isoformat()
    } for l in logs]

@app.get("/api/admin/fraud_alerts")
def list_fraud_alerts(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["ADMIN"]))):
    alerts = db.query(FraudAlert).order_by(FraudAlert.timestamp.desc()).limit(50).all()
    return [{
        "id": a.id,
        "auction_id": a.auction_id,
        "vendor_id": a.vendor_id,
        "vendor_name": a.vendor_name,
        "risk_level": a.risk_level,
        "rule_triggered": a.rule_triggered,
        "details": a.details,
        "timestamp": a.timestamp.isoformat()
    } for a in alerts]
