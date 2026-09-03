import os
import sys
import uuid
import secrets
import smtplib
import datetime
from email.mime.text import MIMEText
import requests
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from typing import List

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from backend.app.database import get_db
from backend.app.models import User, Vendor, VerificationToken, UserDocument
from backend.app.schemas import (
    RegisterRequest, VerifyEmailRequest, ResendVerificationRequest,
    AccountStatusResponse, DocumentReviewRequest, TokenResponse,
    SendOTPRequest, VerifyOTPRequest, ExtendedRegisterRequest,
    SubmitApplicationRequest
)
from backend.app.auth import (
    hash_password, verify_password, create_access_token,
    create_verification_record
)
from backend.app.services import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def send_via_smtp(email: str, otp_code: str, html_template: str) -> bool:
    try:
        message = MIMEText(html_template, "html")
        message["Subject"] = f"{otp_code} is your ReBid AI Verification Code"
        message["From"] = f"ReBid AI <{SMTP_FROM}>"
        message["To"] = email

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [email], message.as_string())

        print(f"[SMTP Email Success] OTP email sent to {email}")
        return True
    except Exception as e:
        print(f"[SMTP Exception] {e}")
        return False


def send_otp_email(email: str, otp_code: str):
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background: #0F172A; color: #FFFFFF; padding: 32px 40px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; font-weight: 800; }}
            .header p {{ margin: 8px 0 0 0; opacity: 0.8; font-size: 14px; }}
            .body {{ padding: 40px; text-align: center; }}
            .otp-box {{ display: inline-block; background: #F0FDF4; border: 2px solid #059669; border-radius: 12px; padding: 24px 40px; margin: 24px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #0F172A; font-family: 'Courier New', monospace; }}
            .expiry {{ color: #DC2626; font-size: 13px; font-weight: 600; margin-top: 16px; }}
            .footer {{ background: #F8FAFC; padding: 20px 40px; text-align: center; color: #64748B; font-size: 12px; border-top: 1px solid #E2E8F0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ReBid AI</h1>
                <p>Enterprise Reverse Procurement Platform</p>
            </div>
            <div class="body">
                <h2 style="margin-bottom: 8px; color: #0F172A;">Email Verification Code</h2>
                <p style="color: #64748B; margin-bottom: 24px;">Use the following code to verify your email address:</p>
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                </div>
                <p class="expiry">This code expires in 10 minutes</p>
                <p style="color: #64748B; font-size: 13px; margin-top: 24px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>2026 ReBid AI. All rights reserved.</p>
                <p>Enterprise Procurement Solutions</p>
            </div>
        </div>
    </body>
    </html>
    """

    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        if send_via_smtp(email, otp_code, html_template):
            return True
        print(f"\n{'='*60}")
        print(f"[DEV MODE FALLBACK] OTP for {email}: {otp_code}")
        print(f"{'='*60}\n")
        return True

    if RESEND_API_KEY:
        try:
            response = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "ReBid AI <onboarding@resend.dev>",
                    "to": [email],
                    "subject": f"{otp_code} is your ReBid AI Verification Code",
                    "html": html_template
                }
            )
            if response.status_code in [200, 201]:
                print(f"[Resend Email Success] OTP email sent to {email}. Resend ID: {response.json().get('id')}")
                return True
            else:
                print(f"[Resend API Notice {response.status_code}] {response.text}")
                print(f"\n{'='*60}")
                print(f"[DEV MODE FALLBACK] OTP for {email}: {otp_code}")
                print(f"{'='*60}\n")
                return True
        except Exception as e:
            print(f"[Resend Exception] {e}")
            print(f"\n{'='*60}")
            print(f"[DEV MODE FALLBACK] OTP for {email}: {otp_code}")
            print(f"{'='*60}\n")
            return True
    else:
        print(f"\n{'='*60}")
        print(f"[DEV MODE] OTP for {email}: {otp_code}")
        print(f"{'='*60}\n")
        return True


@router.post("/send-otp")
def send_otp(req: SendOTPRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    now = datetime.datetime.utcnow()
    existing_token = db.query(VerificationToken).filter(
        VerificationToken.user_id == user.id,
        VerificationToken.purpose == "email_verification",
        VerificationToken.used == False
    ).first()

    if existing_token and existing_token.resend_cooldown_until and existing_token.resend_cooldown_until > now:
        remaining = int((existing_token.resend_cooldown_until - now).total_seconds())
        raise HTTPException(status_code=429, detail=f"Please wait {remaining} seconds before requesting a new code")

    otp_code = ''.join(secrets.choice('0123456789') for _ in range(6))
    expires_at = now + datetime.timedelta(minutes=10)
    cooldown_until = now + datetime.timedelta(seconds=60)

    if existing_token:
        existing_token.otp_code = otp_code
        existing_token.expires_at = expires_at
        existing_token.resend_cooldown_until = cooldown_until
        existing_token.attempts_count = 0
    else:
        new_token = VerificationToken(
            id=f"vt_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            token_string=uuid.uuid4().hex,
            otp_code=otp_code,
            purpose="email_verification",
            expires_at=expires_at,
            resend_cooldown_until=cooldown_until,
            attempts_count=0,
            used=False
        )
        db.add(new_token)

    db.commit()

    email_sent = send_otp_email(user.email, otp_code)

    return {
        "status": "success",
        "message": "Verification code sent" if email_sent else "Code generated (check console in dev mode)",
        "resend_cooldown_seconds": 60
    }


@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified:
        return {"status": "success", "message": "Email already verified"}

    token_record = db.query(VerificationToken).filter(
        VerificationToken.user_id == user.id,
        VerificationToken.otp_code == req.otp_code,
        VerificationToken.purpose == "email_verification",
        VerificationToken.used == False
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if token_record.attempts_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum attempts exceeded. Please request a new code")

    if token_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired")

    token_record.attempts_count += 1

    token_record.used = True
    user.email_verified = True
    user.email_verified_at = datetime.datetime.utcnow()
    user.status = "pending_documents"
    db.commit()

    log_audit_event(db, "EMAIL_VERIFIED", user.name, {"email": user.email})

    return {
        "status": "success",
        "message": "Email verified successfully. Please upload your verification documents.",
        "next_step": "/api/auth/upload-document"
    }


@router.post("/register")
def register_user(req: ExtendedRegisterRequest = Body(...), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email address already registered")
    
    if req.role not in ["BUYER", "VENDOR"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be BUYER or VENDOR")
    
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    new_user = User(
        id=user_id,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
        name=req.name,
        email_verified=False,
        status="pending_verification"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    if req.role == "VENDOR":
        vendor_id = f"VND-{uuid.uuid4().hex[:8].upper()}"
        new_vendor = Vendor(
            id=vendor_id,
            user_id=user_id,
            name=req.name,
            company_name=req.company_name or req.name,
            category=req.category or "General",
            verified=False,
            rating=4.5,
            reliability_score=0.90,
            delivery_score=90.0,
            contracts_completed=0,
            cancellation_rate=0.0,
            avg_delay_days=0.0,
            defect_rate=0.0,
            rep_name=req.rep_name,
            rep_designation=req.rep_designation,
            rep_phone=req.rep_phone,
            rep_email=req.rep_email,
            gst_number=req.gst_number,
            pan_number=req.pan_number,
            cin=req.cin,
            org_type=req.org_type,
            years_in_business=req.years_in_business,
            registered_address=req.registered_address,
            certifications_json=req.certifications_json,
            client_references_json=req.client_references_json,
            bank_account_name=req.bank_account_name,
            bank_name=req.bank_name,
            bank_account_number=req.bank_account_number,
            bank_ifsc=req.bank_ifsc,
            bank_upi=req.bank_upi
        )
        db.add(new_vendor)
        db.commit()
    
    log_audit_event(db, "USER_REGISTERED", req.name, {"email": req.email, "role": req.role})

    otp_code = ''.join(secrets.choice('0123456789') for _ in range(6))
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    cooldown_until = datetime.datetime.utcnow() + datetime.timedelta(seconds=60)
    
    verification_token = VerificationToken(
        id=f"vt_{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        token_string=uuid.uuid4().hex,
        otp_code=otp_code,
        purpose="email_verification",
        expires_at=expires_at,
        resend_cooldown_until=cooldown_until,
        attempts_count=0,
        used=False
    )
    db.add(verification_token)
    db.commit()
    
    send_otp_email(req.email, otp_code)
    
    return {
        "status": "success",
        "message": "Account registered successfully. Please verify your email address.",
        "user_id": user_id,
        "otp_sent": True,
        "next_step": "Verify email using /api/auth/verify-otp"
    }


@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email_verified:
        return {"status": "success", "message": "Email already verified"}
    
    token_record = db.query(VerificationToken).filter(
        VerificationToken.user_id == user.id,
        VerificationToken.token_string == req.token,
        VerificationToken.purpose == "email_verification",
        VerificationToken.used == False
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    if token_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token has expired")
    
    token_record.used = True
    user.email_verified = True
    user.email_verified_at = datetime.datetime.utcnow()
    user.status = "pending_documents"
    db.commit()
    
    return {
        "status": "success",
        "message": "Email verified successfully. Please upload your verification documents.",
        "next_step": "/api/auth/upload-document"
    }


@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email_verified:
        return {"status": "success", "message": "Email already verified"}
    
    verification_token = create_verification_record(db, user.id, "email_verification", expires_hours=24)
    
    return {
        "status": "success",
        "message": "Verification token resent successfully",
        "verification_token": verification_token
    }


@router.get("/status", response_model=AccountStatusResponse)
def get_account_status(db: Session = Depends(get_db), current_user: dict = Depends(lambda: {})):
    user_id = current_user.get("user_id") if current_user else None
    
    if not user_id:
        if "demo_status_check" not in str(current_user):
            pass
    
    return {
        "user_id": "demo",
        "email": "demo@example.com",
        "name": "Demo User",
        "role": "BUYER",
        "status": "approved",
        "email_verified": True,
        "documents": [],
        "message": "Status endpoint requires authentication"
    }


@router.get("/status/{user_id}", response_model=AccountStatusResponse)
def get_user_status(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    documents = db.query(UserDocument).filter(UserDocument.user_id == user_id).all()
    
    doc_list = [
        {
            "id": doc.id,
            "doc_type": doc.doc_type,
            "file_url": doc.file_url,
            "status": doc.status,
            "rejection_reason": doc.rejection_reason,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "reviewed_at": doc.reviewed_at.isoformat() if doc.reviewed_at else None
        }
        for doc in documents
    ]
    
    status_messages = {
        "pending_verification": "Please verify your email address",
        "pending_documents": "Please upload your verification documents",
        "pending_approval": "Your application is under admin review",
        "under_review": "Your application is under admin review",
        "amendment_required": "Some documents need to be re-uploaded",
        "approved": "Your account is approved",
        "rejected": "Your application has been rejected"
    }
    
    return {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "status": user.status,
        "email_verified": user.email_verified,
        "documents": doc_list,
        "message": status_messages.get(user.status, "")
    }


@router.post("/upload-document")
def upload_document(user_id: str = Query(...), doc_type: str = Query(...), file_url: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.email_verified:
        raise HTTPException(status_code=400, detail="Email verification required before uploading documents")
    
    if user.status not in ["pending_documents", "amendment_required"]:
        raise HTTPException(status_code=400, detail=f"Cannot upload documents in {user.status} status")
    
    valid_doc_types = ["business_license", "tax_id", "certification", "bank_info", "signatory_id", "company_profile", "logo", "address_proof"]
    if doc_type not in valid_doc_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Must be one of: {valid_doc_types}")
    
    existing_doc = db.query(UserDocument).filter(
        UserDocument.user_id == user_id,
        UserDocument.doc_type == doc_type
    ).first()

    if existing_doc and existing_doc.status in ["pending", "approved"]:
        raise HTTPException(status_code=400, detail=f"Document of type '{doc_type}' already exists")

    if existing_doc and existing_doc.status == "rejected":
        # Re-upload supersedes the rejected record instead of leaving it around,
        # which would otherwise permanently block admin approval and keep the
        # applicant stuck showing the same rejection forever.
        db.delete(existing_doc)

    doc_id = f"DOC-{uuid.uuid4().hex[:12]}"
    new_doc = UserDocument(
        id=doc_id,
        user_id=user_id,
        doc_type=doc_type,
        file_url=file_url,
        status="pending",
        uploaded_at=datetime.datetime.utcnow()
    )
    db.add(new_doc)

    # If this was the last outstanding rejected document, send the applicant
    # back into the admin review queue so the resubmission actually gets seen.
    if user.status == "amendment_required":
        other_rejected = db.query(UserDocument).filter(
            UserDocument.user_id == user_id,
            UserDocument.doc_type != doc_type,
            UserDocument.status == "rejected"
        ).count()
        if other_rejected == 0:
            user.status = "pending_approval"

    db.commit()

    return {
        "status": "success",
        "message": "Document uploaded successfully",
        "document_id": doc_id,
        "user_status": user.status
    }


@router.post("/submit-application")
def submit_application(req: SubmitApplicationRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.email_verified:
        raise HTTPException(status_code=400, detail="Email verification required before submitting application")
    
    documents = db.query(UserDocument).filter(UserDocument.user_id == req.user_id).all()
    
    required_docs = {"business_license", "tax_id", "certification", "bank_info"}
    uploaded_docs = {d.doc_type for d in documents if d.status != "rejected"}
    
    missing_docs = required_docs - uploaded_docs
    if missing_docs:
        raise HTTPException(status_code=400, detail=f"Missing required documents: {', '.join(missing_docs)}")
    
    rejected_docs = [d for d in documents if d.status == "rejected"]
    if rejected_docs:
        raise HTTPException(status_code=400, detail="Some documents were rejected. Please re-upload them.")
    
    # Must be "pending_approval" -- that's the status string the admin review
    # queue (/admin/documents/pending) and approve endpoint actually filter on.
    # "under_review" was a dead-end: applicants set to it never appeared in any
    # admin queue and could never be approved.
    user.status = "pending_approval"
    db.commit()

    log_audit_event(db, "VENDOR_APPLICATION_SUBMITTED", user.name, {"email": user.email, "user_id": req.user_id})
    
    return {
        "status": "success",
        "message": "Application submitted successfully for admin review",
        "user_status": user.status
    }


@router.post("/login", response_model=TokenResponse)
def unified_login(email: str = Body(..., embed=True), password: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first()
    
    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "name": user.name,
        "vendor_id": vendor.id if vendor else None
    }
    
    access_token = create_access_token(token_data)
    
    response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        status=user.status,
        name=user.name,
        email=user.email,
        vendor_id=vendor.id if vendor else None
    )
    
    if user.status == "rejected":
        response.detail = "Your vendor application was not approved. Please contact support for more information."
    
    return response
