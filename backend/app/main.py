import os
import sys
import csv
import random
import datetime
import uuid
import shutil
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.app.database import engine, Base, get_db
from backend.app.models import User, Vendor, Auction, Bid, AuditLog, FraudAlert, PurchaseOrder, UserDocument, VerificationToken, VendorReview
from backend.app.schemas import (
    LoginRequest, ResetPasswordRequest, TokenResponse, CreateAuctionRequest, SubmitBidRequest,
    AwardContractRequest, RecommendationResponse
)
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user, require_role, require_approved_role
from backend.app.services import log_audit_event, analyze_bid_fraud, generate_purchase_order_pdf, format_inr, generate_stock_verification_document, STOCK_DOC_TYPES
from ml.predict import ai_engine
from backend.app.routes.auth import router as auth_router
from backend.app.routes.admin_docs import router as admin_docs_router
from backend.app.routes.user import router as user_router

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
app.include_router(user_router)

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
        # 1. Seed Enterprise Users (Buyer, Admin, and 10 Industry Vendors) with rich realistic profile data
        demo_accounts = [
            {
                "id": "usr_buyer",
                "email": "buyer@rebid.ai",
                "name": "Enterprise Procurement Corp",
                "role": "BUYER",
                "company_name": "Apex Global Procurement Ltd",
                "rep_name": "Vikram Malhotra",
                "rep_designation": "VP Global Sourcing & Supply Chain",
                "rep_phone": "+91 98201 54321",
                "rep_email": "vikram.malhotra@apexprocure.com",
                "gst_number": "27AAACA9876Q1Z2",
                "pan_number": "AAACA9876Q",
                "cin": "U74999MH2018PTC309876",
                "org_type": "Public Limited",
                "years_in_business": 14,
                "registered_address": "Level 12, Tower 3, Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra 400051",
                "bank_account_name": "Apex Global Procurement Ltd - Corporate",
                "bank_name": "HDFC Bank",
                "bank_account_number": "50200045892147",
                "bank_ifsc": "HDFC0000060",
                "bank_upi": "apexprocure@hdfcbank"
            },
            {
                "id": "usr_admin",
                "email": "admin@rebid.ai",
                "name": "Compliance Administrator",
                "role": "ADMIN",
                "company_name": "ReBid AI Governance Center",
                "rep_name": "Dr. Ananya Iyer",
                "rep_designation": "Chief Compliance Officer & System Administrator",
                "rep_phone": "+91 98110 87654",
                "rep_email": "ananya.iyer@rebid.ai",
                "gst_number": "06AAACR5544P1Z3",
                "pan_number": "AAACR5544P",
                "cin": "U72200HR2022PTC105432",
                "org_type": "Private Limited",
                "years_in_business": 4,
                "registered_address": "Cyber City, DLF Phase 3, Sector 24, Gurugram, Haryana 122002",
                "bank_account_name": "ReBid AI Technologies Private Limited",
                "bank_name": "ICICI Bank",
                "bank_account_number": "000405099881",
                "bank_ifsc": "ICIC0000004",
                "bank_upi": "rebidgov@icici"
            },
            # 10 Industry Vendor Users
            {
                "id": "usr_hp",
                "email": "vendor1@rebid.ai",
                "name": "HP Enterprise Solutions",
                "role": "VENDOR",
                "category": "IT Hardware",
                "rel": 0.96,
                "del": 95.0,
                "rating": 4.9,
                "company_name": "Hewlett Packard Enterprise India Pvt Ltd",
                "rep_name": "Rohan Sengupta",
                "rep_designation": "Director - Enterprise Public Sector",
                "rep_phone": "+91 98450 12345",
                "rep_email": "rohan.sengupta@hpe-india.com",
                "gst_number": "29AABCH1234F1Z8",
                "pan_number": "AABCH1234F",
                "cin": "U72200KA2000PTC028456",
                "org_type": "Private Limited",
                "years_in_business": 24,
                "registered_address": "24 Salarpuria Arena, Hosur Main Road, Adugodi, Bengaluru, Karnataka 560030",
                "bank_account_name": "Hewlett Packard Enterprise India Pvt Ltd",
                "bank_name": "Citibank N.A.",
                "bank_account_number": "054321987654",
                "bank_ifsc": "CITI0000004",
                "bank_upi": "hpeindia@citibank"
            },
            {
                "id": "usr_dell",
                "email": "vendor2@rebid.ai",
                "name": "Dell Technologies",
                "role": "VENDOR",
                "category": "IT Hardware",
                "rel": 0.92,
                "del": 91.0,
                "rating": 4.7,
                "company_name": "Dell International Services India Pvt Ltd",
                "rep_name": "Meera Krishnan",
                "rep_designation": "National Sales Head - Commercial",
                "rep_phone": "+91 98801 65432",
                "rep_email": "meera.krishnan@dell-commercial.com",
                "gst_number": "29AABCD5678G1Z4",
                "pan_number": "AABCD5678G",
                "cin": "U72900KA1996PTC020584",
                "org_type": "Private Limited",
                "years_in_business": 28,
                "registered_address": "Divyasree Greens, Ground Floor, Inner Ring Road, Domlur, Bengaluru, Karnataka 560071",
                "bank_account_name": "Dell International Services India Pvt Ltd",
                "bank_name": "Standard Chartered Bank",
                "bank_account_number": "428059871234",
                "bank_ifsc": "SCBL0036001",
                "bank_upi": "dellindia@scb"
            },
            {
                "id": "usr_lenovo",
                "email": "lenovo@rebid.ai",
                "name": "Lenovo Business",
                "role": "VENDOR",
                "category": "IT Hardware",
                "rel": 0.89,
                "del": 88.0,
                "rating": 4.6,
                "company_name": "Lenovo India Private Limited",
                "rep_name": "Amitabh Verma",
                "rep_designation": "Executive Director - Commercial PC",
                "rep_phone": "+91 97170 34567",
                "rep_email": "amitabh.verma@lenovo-corp.com",
                "gst_number": "29AABCL3456K1Z9",
                "pan_number": "AABCL3456K",
                "cin": "U30009KA2005PTC035789",
                "org_type": "Private Limited",
                "years_in_business": 19,
                "registered_address": "Ferns Icon, Level 2, Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037",
                "bank_account_name": "Lenovo India Private Limited",
                "bank_name": "HSBC Bank India",
                "bank_account_number": "012384759201",
                "bank_ifsc": "HSBC0560002",
                "bank_upi": "lenovoindia@hsbc"
            },
            {
                "id": "usr_acer",
                "email": "acer@rebid.ai",
                "name": "Acer Commercial",
                "role": "VENDOR",
                "category": "IT Hardware",
                "rel": 0.86,
                "del": 87.0,
                "rating": 4.4,
                "company_name": "Acer India Private Limited",
                "rep_name": "Siddharth Nair",
                "rep_designation": "Head of Government & Commercial Solutions",
                "rep_phone": "+91 99000 87654",
                "rep_email": "siddharth.nair@acer-solutions.com",
                "gst_number": "29AABCA7890M1Z3",
                "pan_number": "AABCA7890M",
                "cin": "U32109KA1999PTC025412",
                "org_type": "Private Limited",
                "years_in_business": 25,
                "registered_address": "Embassy Heights, 6th Floor, Magrath Road, Ashok Nagar, Bengaluru, Karnataka 560025",
                "bank_account_name": "Acer India Private Limited",
                "bank_name": "State Bank of India",
                "bank_account_number": "31098475621",
                "bank_ifsc": "SBIN0001858",
                "bank_upi": "acerindia@sbi"
            },
            {
                "id": "usr_tata",
                "email": "tatasteel@rebid.ai",
                "name": "Tata Steel Ltd",
                "role": "VENDOR",
                "category": "Raw Materials & Metals",
                "rel": 0.95,
                "del": 94.0,
                "rating": 4.9,
                "company_name": "Tata Steel Limited",
                "rep_name": "Debashish Roy",
                "rep_designation": "Chief Procurement & B2B Solutions",
                "rep_phone": "+91 94311 23456",
                "rep_email": "debashish.roy@tatasteel.com",
                "gst_number": "20AAACT2702H1ZK",
                "pan_number": "AAACT2702H",
                "cin": "L27100MH1907PLC000260",
                "org_type": "Public Limited",
                "years_in_business": 117,
                "registered_address": "Bombay House, 24 Homi Mody Street, Fort, Mumbai, Maharashtra 400001",
                "bank_account_name": "Tata Steel Limited - Commercial Bids",
                "bank_name": "State Bank of India",
                "bank_account_number": "10984756291",
                "bank_ifsc": "SBIN0000300",
                "bank_upi": "tatasteel@sbi"
            },
            {
                "id": "usr_jsw",
                "email": "jswsteel@rebid.ai",
                "name": "JSW Steel Infra",
                "role": "VENDOR",
                "category": "Raw Materials & Metals",
                "rel": 0.91,
                "del": 90.0,
                "rating": 4.7,
                "company_name": "JSW Steel Infra Ltd",
                "rep_name": "Pooja Hegde",
                "rep_designation": "VP Industrial Marketing & Supply",
                "rep_phone": "+91 98200 45678",
                "rep_email": "pooja.hegde@jsw.in",
                "gst_number": "27AAACJ4321N1ZY",
                "pan_number": "AAACJ4321N",
                "cin": "L27102MH1994PLC152925",
                "org_type": "Public Limited",
                "years_in_business": 30,
                "registered_address": "JSW Centre, Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra 400051",
                "bank_account_name": "JSW Steel Infra Ltd",
                "bank_name": "ICICI Bank",
                "bank_account_number": "000405012948",
                "bank_ifsc": "ICIC0000004",
                "bank_upi": "jswsteel@icici"
            },
            {
                "id": "usr_lt",
                "email": "ltconst@rebid.ai",
                "name": "L&T Construction",
                "role": "VENDOR",
                "category": "Construction & Infrastructure",
                "rel": 0.94,
                "del": 93.0,
                "rating": 4.8,
                "company_name": "Larsen & Toubro Limited - Heavy Civil Infra",
                "rep_name": "K. R. Venkataraman",
                "rep_designation": "Senior VP Tendering & Contracts",
                "rep_phone": "+91 98400 98765",
                "rep_email": "kr.venkat@lntecc.com",
                "gst_number": "33AAACL0140P1ZU",
                "pan_number": "AAACL0140P",
                "cin": "L99999MH1946PLC004768",
                "org_type": "Public Limited",
                "years_in_business": 86,
                "registered_address": "L&T House, Ballard Estate, N. M. Marg, Mumbai, Maharashtra 400001",
                "bank_account_name": "Larsen & Toubro Ltd Infra Division",
                "bank_name": "Axis Bank",
                "bank_account_number": "912020034958172",
                "bank_ifsc": "UTIB0000005",
                "bank_upi": "ltinfra@axisbank"
            },
            {
                "id": "usr_bluedart",
                "email": "bluedart@rebid.ai",
                "name": "Blue Dart Logistics",
                "role": "VENDOR",
                "category": "Logistics & Freight",
                "rel": 0.93,
                "del": 96.0,
                "rating": 4.8,
                "company_name": "Blue Dart Express Limited",
                "rep_name": "Sunil Shenoy",
                "rep_designation": "Head of Corporate Logistics & Enterprise",
                "rep_phone": "+91 98210 65432",
                "rep_email": "sunil.shenoy@bluedart.com",
                "gst_number": "27AAACB2188E1ZG",
                "pan_number": "AAACB2188E",
                "cin": "L61074MH1991PLC061074",
                "org_type": "Public Limited",
                "years_in_business": 33,
                "registered_address": "Blue Dart Centre, Sahar Airport Road, Andheri East, Mumbai, Maharashtra 400099",
                "bank_account_name": "Blue Dart Express Limited",
                "bank_name": "Kotak Mahindra Bank",
                "bank_account_number": "6811234509",
                "bank_ifsc": "KKBK0000958",
                "bank_upi": "bluedart@kotak"
            },
            {
                "id": "usr_dhl",
                "email": "dhl@rebid.ai",
                "name": "DHL Supply Chain",
                "role": "VENDOR",
                "category": "Logistics & Freight",
                "rel": 0.90,
                "del": 92.0,
                "rating": 4.6,
                "company_name": "DHL Express India Pvt Ltd",
                "rep_name": "Farhan Qureshi",
                "rep_designation": "Director Global Forwarding",
                "rep_phone": "+91 98190 32109",
                "rep_email": "farhan.qureshi@dhl.com",
                "gst_number": "27AAACD1111Q1Z8",
                "pan_number": "AAACD1111Q",
                "cin": "U64120MH2001PTC132984",
                "org_type": "Private Limited",
                "years_in_business": 23,
                "registered_address": "801 Silver Metropolis, Western Express Highway, Goregaon East, Mumbai, Maharashtra 400063",
                "bank_account_name": "DHL Express India Pvt Ltd",
                "bank_name": "Deutsche Bank AG",
                "bank_account_number": "0018394012",
                "bank_ifsc": "DEUT0784BBY",
                "bank_upi": "dhlindia@db"
            },
            {
                "id": "usr_amazon",
                "email": "amazon@rebid.ai",
                "name": "Amazon Business Services",
                "role": "VENDOR",
                "category": "Software & Cloud Services",
                "rel": 0.97,
                "del": 97.0,
                "rating": 4.9,
                "company_name": "Amazon Wholesale India Private Limited",
                "rep_name": "Priyanka Saxena",
                "rep_designation": "General Manager - Enterprise B2B",
                "rep_phone": "+91 98860 11223",
                "rep_email": "priyanka.saxena@amazon.in",
                "gst_number": "29AABCA9999K1Z5",
                "pan_number": "AABCA9999K",
                "cin": "U51900KA2013PTC068705",
                "org_type": "Private Limited",
                "years_in_business": 11,
                "registered_address": "Brigade Gateway, 8th-14th Floor, 26/1 Dr. Rajkumar Road, Malleshwaram, Bengaluru, Karnataka 560055",
                "bank_account_name": "Amazon Wholesale India Private Limited",
                "bank_name": "JPMorgan Chase Bank N.A.",
                "bank_account_number": "0009847123984",
                "bank_ifsc": "CHAS0INBX01",
                "bank_upi": "amazonb2b@jpmorgan"
            }
        ]

        for acc in demo_accounts:
            existing_user = db.query(User).filter(User.email == acc["email"]).first()
            if not existing_user:
                existing_user = User(
                    id=acc["id"],
                    email=acc["email"],
                    password_hash=hash_password("password123"),
                    role=acc["role"],
                    name=acc["name"],
                    email_verified=True,
                    status="approved"
                )
                db.add(existing_user)
            
            # Enrich user fields
            existing_user.company_name = acc.get("company_name", acc["name"])
            existing_user.rep_name = acc.get("rep_name", acc["name"])
            existing_user.rep_designation = acc.get("rep_designation", "Authorized Representative")
            existing_user.rep_phone = acc.get("rep_phone", "+91 98765 43210")
            existing_user.rep_email = acc.get("rep_email", acc["email"])
            existing_user.gst_number = acc.get("gst_number")
            existing_user.pan_number = acc.get("pan_number")
            existing_user.cin = acc.get("cin")
            existing_user.org_type = acc.get("org_type", "Private Limited")
            existing_user.years_in_business = acc.get("years_in_business", 10)
            existing_user.registered_address = acc.get("registered_address")
            existing_user.bank_account_name = acc.get("bank_account_name")
            existing_user.bank_name = acc.get("bank_name")
            existing_user.bank_account_number = acc.get("bank_account_number")
            existing_user.bank_ifsc = acc.get("bank_ifsc")
            existing_user.bank_upi = acc.get("bank_upi")
            db.commit()

            # Seed or enrich vendor profile if vendor
            if acc["role"] == "VENDOR":
                v_id = f"VND-{acc['id'].upper().replace('USR_', '')}"
                existing_vendor = db.query(Vendor).filter((Vendor.id == v_id) | (Vendor.user_id == acc["id"])).first()
                if not existing_vendor:
                    existing_vendor = Vendor(
                        id=v_id,
                        user_id=acc["id"],
                        name=acc["name"],
                        company_name=acc.get("company_name", acc["name"]),
                        category=acc.get("category", "IT Hardware"),
                        verified=True,
                        rating=acc.get("rating", 4.5),
                        reliability_score=acc.get("rel", 0.90),
                        delivery_score=acc.get("del", 90.0),
                        contracts_completed=random.randint(60, 200),
                        cancellation_rate=0.01,
                        avg_delay_days=0.8,
                        defect_rate=0.008
                    )
                    db.add(existing_vendor)
                
                existing_vendor.company_name = acc.get("company_name", acc["name"])
                existing_vendor.category = acc.get("category", existing_vendor.category)
                existing_vendor.rep_name = acc.get("rep_name", acc["name"])
                existing_vendor.rep_designation = acc.get("rep_designation")
                existing_vendor.rep_phone = acc.get("rep_phone")
                existing_vendor.rep_email = acc.get("rep_email")
                existing_vendor.gst_number = acc.get("gst_number")
                existing_vendor.pan_number = acc.get("pan_number")
                existing_vendor.cin = acc.get("cin")
                existing_vendor.org_type = acc.get("org_type")
                existing_vendor.years_in_business = acc.get("years_in_business")
                existing_vendor.registered_address = acc.get("registered_address")
                existing_vendor.bank_account_name = acc.get("bank_account_name")
                existing_vendor.bank_name = acc.get("bank_name")
                existing_vendor.bank_account_number = acc.get("bank_account_number")
                existing_vendor.bank_ifsc = acc.get("bank_ifsc")
                existing_vendor.bank_upi = acc.get("bank_upi")
                existing_vendor.verified = True
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

    # 4. Seed placeholder verification-document PDFs for demo accounts
    try:
        from backend.scripts.generate_demo_certs import main as generate_demo_certs
        generate_demo_certs()
    except Exception as e:
        print(f"[Startup Error] Demo certificate seeding exception: {e}")


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
    if user:
        vendor_status = user.status
        is_verified_vendor = vendor.verified and vendor_status == "approved"
    else:
        # Synthetic/dataset vendor with no registered user account — these never go
        # through the admin approval workflow, and only ever appear in live bidding
        # when Vendor.verified is True (bot-bid seeding filters on that flag), so the
        # flag alone is their approval signal here.
        vendor_status = "approved" if vendor.verified else "pending_approval"
        is_verified_vendor = vendor.verified

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

    real_reviews = db.query(VendorReview).filter(VendorReview.vendor_id == vendor.id).order_by(VendorReview.created_at.desc()).all()
    if real_reviews:
        reviews = [
            {
                "id": r.id,
                "buyer_company": r.buyer_company,
                "reviewer_name": r.reviewer_name or r.buyer_company,
                "reviewer_title": "Verified Buyer",
                "stars": r.stars,
                "review_text": r.review_text,
                "photo_url": r.photo_url,
                "date": r.created_at.strftime("%B %d, %Y") if r.created_at else "",
                "verified": True
            }
            for r in real_reviews
        ]

    if vendor.cancellation_rate > 0.05 or rel_pct < 80:
        risk_level = "HIGH"
    elif vendor.cancellation_rate > 0.02 or rel_pct < 88:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    ai_score = round((0.40 * 92) + (0.30 * rel_pct) + (0.20 * del_pct) + (0.10 * (rating * 20)), 1)
    years_on_platform = max(1, min(5, (hash(vendor.id) % 6) + 1))

    documents = []
    if vendor.user_id:
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
    else:
        # Dataset/bot vendor with no registered user account, so no real uploads exist.
        # Generate deterministic specimen documents so the profile doesn't look empty.
        for idx, doc_type in enumerate(STOCK_DOC_TYPES):
            file_url = generate_stock_verification_document(vendor.id, vendor.company_name or vendor.name, doc_type)
            documents.append({
                "id": f"STOCK-{vendor.id}-{idx+1}",
                "doc_type": doc_type,
                "file_url": file_url,
                "status": "approved",
                "rejection_reason": None,
                "uploaded_at": None
            })

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
        "status": "approved",
        "documents": documents
    }


@app.get("/api/vendors/{vendor_identifier}/reviews")
def list_vendor_reviews(vendor_identifier: str, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter((Vendor.id == vendor_identifier) | (Vendor.name == vendor_identifier) | (Vendor.company_name == vendor_identifier)).first()
    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor not found for '{vendor_identifier}'")

    reviews = db.query(VendorReview).filter(VendorReview.vendor_id == vendor.id).order_by(VendorReview.created_at.desc()).all()
    return {
        "reviews": [
            {
                "id": r.id,
                "buyer_company": r.buyer_company,
                "reviewer_name": r.reviewer_name or r.buyer_company,
                "stars": r.stars,
                "review_text": r.review_text,
                "photo_url": r.photo_url,
                "date": r.created_at.strftime("%B %d, %Y") if r.created_at else ""
            }
            for r in reviews
        ]
    }


@app.post("/api/vendors/{vendor_identifier}/reviews")
def create_vendor_review(
    vendor_identifier: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["BUYER"]))
):
    vendor = db.query(Vendor).filter((Vendor.id == vendor_identifier) | (Vendor.name == vendor_identifier) | (Vendor.company_name == vendor_identifier)).first()
    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor not found for '{vendor_identifier}'")

    buyer_user = db.query(User).filter(User.id == current_user.get("user_id")).first()
    if not buyer_user:
        raise HTTPException(status_code=404, detail="Buyer account not found")

    buyer_names = {n for n in [buyer_user.name, buyer_user.company_name] if n}
    vendor_names = {n for n in [vendor.name, vendor.company_name] if n}
    has_contract = db.query(PurchaseOrder).filter(
        PurchaseOrder.buyer_name.in_(buyer_names),
        PurchaseOrder.vendor_name.in_(vendor_names)
    ).first()
    if not has_contract:
        raise HTTPException(status_code=403, detail="You can only review vendors you have an awarded contract with")

    stars = payload.get("stars")
    if not isinstance(stars, int) or stars < 1 or stars > 5:
        raise HTTPException(status_code=400, detail="Rating must be an integer between 1 and 5")

    review_text = (payload.get("review_text") or "").strip()
    if not review_text:
        raise HTTPException(status_code=400, detail="Please write a short review comment")

    review = VendorReview(
        id=f"REV-{uuid.uuid4().hex[:10]}",
        vendor_id=vendor.id,
        buyer_user_id=buyer_user.id,
        buyer_company=buyer_user.company_name or buyer_user.name,
        reviewer_name=buyer_user.rep_name or buyer_user.name,
        po_id=has_contract.id,
        stars=stars,
        review_text=review_text,
        photo_url=payload.get("photo_url")
    )
    db.add(review)

    # Keep vendor's headline rating in sync with real reviews
    all_reviews = db.query(VendorReview).filter(VendorReview.vendor_id == vendor.id).all()
    avg_rating = (sum(r.stars for r in all_reviews) + stars) / (len(all_reviews) + 1)
    vendor.rating = round(avg_rating, 2)

    db.commit()
    log_audit_event(db, "VENDOR_REVIEW_SUBMITTED", buyer_user.name, {"vendor_id": vendor.id, "stars": stars})

    return {"status": "success", "message": "Review submitted successfully"}


@app.get("/api/buyers/{buyer_identifier}/profile")
def get_buyer_profile(buyer_identifier: str, db: Session = Depends(get_db)):
    buyer = db.query(User).filter(
        User.role == "BUYER",
        (User.id == buyer_identifier) | (User.name == buyer_identifier) | (User.company_name == buyer_identifier)
    ).first()
    if not buyer:
        raise HTTPException(status_code=404, detail=f"Buyer profile not found for '{buyer_identifier}'")

    buyer_names = {n for n in [buyer.name, buyer.company_name] if n}
    orders = db.query(PurchaseOrder).filter(PurchaseOrder.buyer_name.in_(buyer_names)).all()
    auctions_posted = db.query(Auction).filter(Auction.buyer_id == buyer.id).count()

    return {
        "id": buyer.id,
        "name": buyer.name,
        "company_name": buyer.company_name or buyer.name,
        "rep_name": buyer.rep_name,
        "rep_designation": buyer.rep_designation,
        "registered_address": buyer.registered_address,
        "verified": buyer.status == "approved",
        "status": buyer.status,
        "member_since": buyer.created_at.strftime("%B %Y") if buyer.created_at else None,
        "auctions_posted": auctions_posted,
        "contracts_awarded": len(orders),
        "total_procurement_value": sum(o.amount for o in orders)
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
def create_auction(req: CreateAuctionRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_approved_role(["BUYER", "ADMIN"]))):
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

    buyer_user = db.query(User).filter(User.id == auction.buyer_id).first() if auction.buyer_id else None

    return {
        "id": auction.id,
        "title": auction.title,
        "category": auction.category,
        "max_budget": auction.max_budget,
        "status": auction.status,
        "buyer_id": auction.buyer_id,
        "buyer_name": (buyer_user.company_name or buyer_user.name) if buyer_user else None,
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
def submit_bid(req: SubmitBidRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_approved_role(["VENDOR", "ADMIN"]))):
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
def award_contract(req: AwardContractRequest, db: Session = Depends(get_db), current_user: dict = Depends(require_approved_role(["BUYER", "ADMIN"]))):
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
        "company_name": u.company_name,
        "role": u.role,
        "status": u.status,
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
