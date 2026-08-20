import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    status = Column(String, default="pending_verification")
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    company_name = Column(String, nullable=True)
    rep_name = Column(String, nullable=True)
    rep_designation = Column(String, nullable=True)
    rep_phone = Column(String, nullable=True)
    rep_email = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    cin = Column(String, nullable=True)
    org_type = Column(String, nullable=True)
    years_in_business = Column(Integer, nullable=True)
    registered_address = Column(Text, nullable=True)
    bank_account_name = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    bank_upi = Column(String, nullable=True)

    vendor_profile = relationship("Vendor", back_populates="user", uselist=False)
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="IT Hardware")
    verified = Column(Boolean, default=False)
    rating = Column(Float, default=4.5)
    reliability_score = Column(Float, default=0.90)
    delivery_score = Column(Float, default=90.0)
    contracts_completed = Column(Integer, default=0)
    cancellation_rate = Column(Float, default=0.02)
    avg_delay_days = Column(Float, default=1.0)
    defect_rate = Column(Float, default=0.01)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    rep_name = Column(String, nullable=True)
    rep_designation = Column(String, nullable=True)
    rep_phone = Column(String, nullable=True)
    rep_email = Column(String, nullable=True)

    gst_number = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    cin = Column(String, nullable=True)
    org_type = Column(String, nullable=True)
    years_in_business = Column(Integer, nullable=True)
    registered_address = Column(Text, nullable=True)

    certifications_json = Column(Text, nullable=True)
    client_references_json = Column(Text, nullable=True)
    previous_contracts_json = Column(Text, nullable=True)
    product_categories_json = Column(Text, nullable=True)
    manufacturing_capacity = Column(String, nullable=True)

    bank_account_name = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    bank_upi = Column(String, nullable=True)

    user = relationship("User", back_populates="vendor_profile")

class Auction(Base):
    __tablename__ = "auctions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, default="IT Hardware")
    max_budget = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="draft") # draft, live, completed, awarded
    weight_cost = Column(Integer, default=40)
    weight_reliability = Column(Integer, default=30)
    weight_delivery = Column(Integer, default=20)
    weight_reviews = Column(Integer, default=10)
    buyer_id = Column(String, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bids = relationship("Bid", back_populates="auction", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(String, primary_key=True, index=True)
    auction_id = Column(String, ForeignKey("auctions.id"), nullable=False)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    vendor_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    auction = relationship("Auction", back_populates="bids")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    action = Column(String, nullable=False) # AUCTION_CREATED, BID_SUBMITTED, etc.
    actor = Column(String, nullable=False)  # User or System name
    details = Column(Text, nullable=True)   # JSON string or description
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(String, primary_key=True, index=True)
    auction_id = Column(String, nullable=True)
    vendor_id = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    risk_level = Column(String, nullable=False) # HIGH, MEDIUM
    rule_triggered = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String, primary_key=True, index=True)
    auction_id = Column(String, nullable=False)
    buyer_name = Column(String, nullable=False)
    vendor_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    doc_type = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String, nullable=True)

    user = relationship("User", back_populates="documents")

class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token_string = Column(String, unique=True, nullable=False, index=True)
    otp_code = Column(String, nullable=True, index=True)
    purpose = Column(String, nullable=False)
    attempts_count = Column(Integer, default=0)
    resend_cooldown_until = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="verification_tokens")
