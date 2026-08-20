from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str


class ExtendedRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str
    company_name: Optional[str] = None
    category: Optional[str] = None
    rep_name: Optional[str] = None
    rep_designation: Optional[str] = None
    rep_phone: Optional[str] = None
    rep_email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    cin: Optional[str] = None
    org_type: Optional[str] = None
    years_in_business: Optional[int] = None
    registered_address: Optional[str] = None
    certifications_json: Optional[str] = None
    client_references_json: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_upi: Optional[str] = None


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str


class SubmitApplicationRequest(BaseModel):
    user_id: str


class VerifyEmailRequest(BaseModel):
    email: str
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


class UploadDocumentRequest(BaseModel):
    doc_type: str
    file_url: str


class AccountStatusResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    status: str
    email_verified: bool
    documents: List[Dict[str, Any]]
    message: Optional[str] = None


class DocumentReviewRequest(BaseModel):
    approve: bool
    rejection_reason: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    status: str
    name: str
    email: str
    vendor_id: Optional[str] = None
    detail: Optional[str] = None


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


class SubmitBidRequest(BaseModel):
    auction_id: str
    price: float


class AwardContractRequest(BaseModel):
    auction_id: str
    vendor_id: str
    vendor_name: str
    amount: float


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


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    status: str
    email_verified: bool
    created_at: Optional[str] = None
    # Vendor / Org details
    company_name: Optional[str] = None
    category: Optional[str] = None
    verified: Optional[bool] = None
    rating: Optional[float] = None
    rep_name: Optional[str] = None
    rep_designation: Optional[str] = None
    rep_phone: Optional[str] = None
    rep_email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    cin: Optional[str] = None
    org_type: Optional[str] = None
    years_in_business: Optional[int] = None
    registered_address: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_upi: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    category: Optional[str] = None
    rep_name: Optional[str] = None
    rep_designation: Optional[str] = None
    rep_phone: Optional[str] = None
    rep_email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    cin: Optional[str] = None
    org_type: Optional[str] = None
    years_in_business: Optional[int] = None
    registered_address: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_upi: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserPreferencesRequest(BaseModel):
    email_notifications: Optional[bool] = True
    bidding_sounds: Optional[bool] = True
    auto_rank_alerts: Optional[bool] = True
    compact_tables: Optional[bool] = False
    theme: Optional[str] = "light"


class UserPreferencesResponse(BaseModel):
    status: str = "success"
    preferences: Dict[str, Any]

