from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Auth Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str
    email: str
    vendor_id: Optional[str] = None

# Auction Schemas
class CreateAuctionRequest(BaseModel):
    title: str
    category: str = "IT Hardware"
    max_budget: float
    duration_minutes: int = 5
    weight_cost: int = 40
    weight_reliability: int = 30
    weight_delivery: int = 20
    weight_reviews: int = 10

class AuctionStatusResponse(BaseModel):
    id: str
    title: str
    category: str
    max_budget: float
    status: str
    time_remaining_seconds: int
    ends_at: Optional[str] = None
    created_at: str
    weight_cost: int
    weight_reliability: int
    weight_delivery: int
    weight_reviews: int
    leaderboard: List[Dict[str, Any]]

# Bid Schemas
class SubmitBidRequest(BaseModel):
    auction_id: str
    price: float

# Contract Award Schema
class AwardContractRequest(BaseModel):
    auction_id: str
    vendor_id: str
    vendor_name: str
    amount: float

# Decision Report & AI Recommendation
class DecisionReport(BaseModel):
    price_score: float
    reliability_score: float
    delivery_score: float
    history_score: float
    overall_risk: str

class VendorRankItem(BaseModel):
    rank: int
    vendor_id: str
    name: str
    price: float
    ai_confidence: float
    decision_report: DecisionReport
    explanations: List[str]

class RecommendationResponse(BaseModel):
    auction_id: str
    recommended_vendor: Optional[str] = None
    confidence_percentage: float
    ranking_list: List[VendorRankItem]
    decision_report: Optional[DecisionReport] = None
