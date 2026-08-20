import os
import sys
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from backend.app.database import get_db
from backend.app.models import User, Vendor
from backend.app.schemas import (
    UserProfileResponse, UserProfileUpdateRequest,
    ChangePasswordRequest, UserPreferencesRequest, UserPreferencesResponse
)
from backend.app.auth import hash_password, verify_password, get_current_user
from backend.app.services import log_audit_event

router = APIRouter(prefix="/api/user", tags=["User Profile & Settings"])

# In-memory preferences store per user_id (fallback/lightweight)
_user_preferences_store = {}


@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first() if user.role == "VENDOR" else None

    return UserProfileResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        status=user.status,
        email_verified=user.email_verified,
        created_at=user.created_at.isoformat() if user.created_at else None,
        company_name=(vendor.company_name if vendor and vendor.company_name else user.company_name) or user.name,
        category=vendor.category if vendor else None,
        verified=vendor.verified if vendor else (user.status == "approved"),
        rating=vendor.rating if vendor else None,
        rep_name=(vendor.rep_name if vendor and vendor.rep_name else user.rep_name) or user.name,
        rep_designation=(vendor.rep_designation if vendor and vendor.rep_designation else user.rep_designation),
        rep_phone=(vendor.rep_phone if vendor and vendor.rep_phone else user.rep_phone),
        rep_email=(vendor.rep_email if vendor and vendor.rep_email else user.rep_email) or user.email,
        gst_number=(vendor.gst_number if vendor and vendor.gst_number else user.gst_number),
        pan_number=(vendor.pan_number if vendor and vendor.pan_number else user.pan_number),
        cin=(vendor.cin if vendor and vendor.cin else user.cin),
        org_type=(vendor.org_type if vendor and vendor.org_type else user.org_type),
        years_in_business=(vendor.years_in_business if vendor and vendor.years_in_business else user.years_in_business),
        registered_address=(vendor.registered_address if vendor and vendor.registered_address else user.registered_address),
        bank_account_name=(vendor.bank_account_name if vendor and vendor.bank_account_name else user.bank_account_name),
        bank_name=(vendor.bank_name if vendor and vendor.bank_name else user.bank_name),
        bank_account_number=(vendor.bank_account_number if vendor and vendor.bank_account_number else user.bank_account_number),
        bank_ifsc=(vendor.bank_ifsc if vendor and vendor.bank_ifsc else user.bank_ifsc),
        bank_upi=(vendor.bank_upi if vendor and vendor.bank_upi else user.bank_upi),
    )


@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    req: UserProfileUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.name:
        user.name = req.name.strip()
    if req.company_name is not None:
        user.company_name = req.company_name.strip()
    if req.rep_name is not None:
        user.rep_name = req.rep_name.strip()
    if req.rep_designation is not None:
        user.rep_designation = req.rep_designation.strip()
    if req.rep_phone is not None:
        user.rep_phone = req.rep_phone.strip()
    if req.rep_email is not None:
        user.rep_email = req.rep_email.strip()
    if req.gst_number is not None:
        user.gst_number = req.gst_number.strip().upper()
    if req.pan_number is not None:
        user.pan_number = req.pan_number.strip().upper()
    if req.cin is not None:
        user.cin = req.cin.strip().upper()
    if req.org_type is not None:
        user.org_type = req.org_type.strip()
    if req.years_in_business is not None:
        user.years_in_business = req.years_in_business
    if req.registered_address is not None:
        user.registered_address = req.registered_address.strip()
    if req.bank_account_name is not None:
        user.bank_account_name = req.bank_account_name.strip()
    if req.bank_name is not None:
        user.bank_name = req.bank_name.strip()
    if req.bank_account_number is not None:
        user.bank_account_number = req.bank_account_number.strip()
    if req.bank_ifsc is not None:
        user.bank_ifsc = req.bank_ifsc.strip().upper()
    if req.bank_upi is not None:
        user.bank_upi = req.bank_upi.strip()

    vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first()
    if user.role == "VENDOR" and vendor:
        if req.company_name is not None:
            vendor.company_name = req.company_name.strip()
            vendor.name = req.company_name.strip()
        if req.category is not None:
            vendor.category = req.category.strip()
        if req.rep_name is not None:
            vendor.rep_name = req.rep_name.strip()
        if req.rep_designation is not None:
            vendor.rep_designation = req.rep_designation.strip()
        if req.rep_phone is not None:
            vendor.rep_phone = req.rep_phone.strip()
        if req.rep_email is not None:
            vendor.rep_email = req.rep_email.strip()
        if req.gst_number is not None:
            vendor.gst_number = req.gst_number.strip().upper()
        if req.pan_number is not None:
            vendor.pan_number = req.pan_number.strip().upper()
        if req.cin is not None:
            vendor.cin = req.cin.strip().upper()
        if req.org_type is not None:
            vendor.org_type = req.org_type.strip()
        if req.years_in_business is not None:
            vendor.years_in_business = req.years_in_business
        if req.registered_address is not None:
            vendor.registered_address = req.registered_address.strip()
        if req.bank_account_name is not None:
            vendor.bank_account_name = req.bank_account_name.strip()
        if req.bank_name is not None:
            vendor.bank_name = req.bank_name.strip()
        if req.bank_account_number is not None:
            vendor.bank_account_number = req.bank_account_number.strip()
        if req.bank_ifsc is not None:
            vendor.bank_ifsc = req.bank_ifsc.strip().upper()
        if req.bank_upi is not None:
            vendor.bank_upi = req.bank_upi.strip()

    db.commit()
    db.refresh(user)
    if vendor:
        db.refresh(vendor)

    log_audit_event(db, "PROFILE_UPDATED", user.name, {"user_id": user.id, "role": user.role})

    return get_user_profile(current_user=current_user, db=db)


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match records")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")

    user.password_hash = hash_password(req.new_password)
    db.commit()

    log_audit_event(db, "PASSWORD_CHANGED", user.name, {"user_id": user.id, "email": user.email})

    return {
        "status": "success",
        "message": "Password updated successfully! Please use your new password next time you sign in."
    }


@router.get("/preferences", response_model=UserPreferencesResponse)
def get_user_preferences(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id", "default")
    prefs = _user_preferences_store.get(user_id, {
        "email_notifications": True,
        "bidding_sounds": True,
        "auto_rank_alerts": True,
        "compact_tables": False,
        "theme": "light"
    })
    return UserPreferencesResponse(status="success", preferences=prefs)


@router.put("/preferences", response_model=UserPreferencesResponse)
def update_user_preferences(
    req: UserPreferencesRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id", "default")
    prefs = {
        "email_notifications": req.email_notifications,
        "bidding_sounds": req.bidding_sounds,
        "auto_rank_alerts": req.auto_rank_alerts,
        "compact_tables": req.compact_tables,
        "theme": req.theme or "light"
    }
    _user_preferences_store[user_id] = prefs
    return UserPreferencesResponse(status="success", preferences=prefs)
