import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # BUYER, VENDOR, ADMIN
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    vendor_profile = relationship("Vendor", back_populates="user", uselist=False)

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="IT Hardware")
    verified = Column(Boolean, default=False)
    rating = Column(Float, default=4.5)
    reliability_score = Column(Float, default=0.90) # 0.0 to 1.0
    delivery_score = Column(Float, default=90.0)    # 0 to 100.0
    contracts_completed = Column(Integer, default=50)
    cancellation_rate = Column(Float, default=0.02)
    avg_delay_days = Column(Float, default=1.0)
    defect_rate = Column(Float, default=0.01)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
