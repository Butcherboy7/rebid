import os
import sys
import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from backend.app.database import get_db
from backend.app.models import User, UserDocument, Vendor
from backend.app.schemas import DocumentReviewRequest
from backend.app.auth import require_role
from backend.app.services import log_audit_event

router = APIRouter(prefix="/api/admin/documents", tags=["Admin Document Review"])

@router.get("/pending")
def list_pending_documents(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    pending_users = db.query(User).filter(
        User.status == "pending_approval"
    ).order_by(User.created_at.desc()).all()
    
    result = []
    for user in pending_users:
        documents = db.query(UserDocument).filter(
            UserDocument.user_id == user.id
        ).all()
        
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
        
        latest_doc_time = max([d.uploaded_at for d in documents if d.uploaded_at]) if documents else user.created_at
        
        result.append({
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "documents": doc_list,
            "submitted_at": latest_doc_time.isoformat() if latest_doc_time else user.created_at.isoformat()
        })
    
    return result

@router.get("/amendments")
def list_amendment_required(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    amendment_users = db.query(User).filter(
        User.status == "amendment_required"
    ).all()
    
    result = []
    for user in amendment_users:
        rejected_docs = db.query(UserDocument).filter(
            UserDocument.user_id == user.id,
            UserDocument.status == "rejected"
        ).all()
        
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
            for doc in rejected_docs
        ]
        
        result.append({
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "documents": doc_list
        })
    
    return result

@router.post("/{doc_id}/review")
def review_document(
    doc_id: str,
    req: DocumentReviewRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    document = db.query(UserDocument).filter(UserDocument.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    user = db.query(User).filter(User.id == document.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if req.approve:
        document.status = "approved"
        document.reviewed_at = datetime.datetime.utcnow()
        document.reviewed_by = current_user.get("user_id")
        document.rejection_reason = None
        
        log_audit_event(db, "DOCUMENT_APPROVED", current_user.get("name", "Admin"), {
            "doc_id": doc_id,
            "doc_type": document.doc_type,
            "user_id": user.id,
            "user_email": user.email
        })
    else:
        document.status = "rejected"
        document.reviewed_at = datetime.datetime.utcnow()
        document.reviewed_by = current_user.get("user_id")
        
        if not req.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required when rejecting a document")
        
        document.rejection_reason = req.rejection_reason
        user.status = "amendment_required"
        
        log_audit_event(db, "DOCUMENT_REJECTED", current_user.get("name", "Admin"), {
            "doc_id": doc_id,
            "doc_type": document.doc_type,
            "user_id": user.id,
            "user_email": user.email,
            "reason": req.rejection_reason
        })
    
    db.commit()
    
    all_docs = db.query(UserDocument).filter(UserDocument.user_id == user.id).all()
    if all(d.status == "approved" for d in all_docs):
        if user.status in ["pending_approval", "amendment_required"]:
            user.status = "approved"
            user.email_verified = True
            
            if user.role == "VENDOR":
                vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first()
                if vendor:
                    vendor.verified = True
            
            log_audit_event(db, "USER_APPROVED", current_user.get("name", "Admin"), {
                "user_id": user.id,
                "user_email": user.email,
                "role": user.role
            })
            db.commit()
    
    return {
        "status": "success",
        "message": f"Document {'approved' if req.approve else 'rejected'}",
        "doc_status": document.status,
        "user_status": user.status
    }

@router.post("/{user_id}/approve")
def approve_user_account(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.status != "pending_approval":
        raise HTTPException(status_code=400, detail=f"User is in {user.status} status, not pending_approval")
    
    all_docs = db.query(UserDocument).filter(UserDocument.user_id == user_id).all()
    rejected_docs = [d for d in all_docs if d.status == "rejected"]
    
    if rejected_docs:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve user. {len(rejected_docs)} document(s) are currently rejected. Please resolve rejected documents first."
        )
    
    # Auto-approve remaining pending documents
    for doc in all_docs:
        if doc.status == "pending":
            doc.status = "approved"
            doc.reviewed_at = datetime.datetime.utcnow()
            doc.reviewed_by = current_user.get("user_id")

    user.status = "approved"
    user.email_verified = True
    
    if user.role == "VENDOR":
        vendor = db.query(Vendor).filter(Vendor.user_id == user_id).first()
        if vendor:
            vendor.verified = True
        else:
            # If Vendor object doesn't exist for user, create it
            vendor_id = f"VND-{uuid.uuid4().hex[:8].upper()}"
            new_vendor = Vendor(
                id=vendor_id,
                user_id=user.id,
                name=user.name,
                company_name=user.name,
                category="General",
                verified=True,
                rating=4.5,
                reliability_score=0.90,
                delivery_score=90.0,
                contracts_completed=0
            )
            db.add(new_vendor)
    
    log_audit_event(db, "USER_APPROVED", current_user.get("name", "Admin"), {
        "user_id": user_id,
        "user_email": user.email,
        "role": user.role
    })
    
    db.commit()
    
    return {
        "status": "success",
        "message": f"User account approved successfully",
        "user_status": user.status
    }

@router.post("/{user_id}/reject")
def reject_user_account(
    user_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "ADMIN":
        raise HTTPException(status_code=403, detail="Cannot reject admin accounts")
    
    user.status = "rejected"
    
    log_audit_event(db, "USER_REJECTED", current_user.get("name", "Admin"), {
        "user_id": user_id,
        "user_email": user.email,
        "reason": reason
    })
    
    db.commit()
    
    return {
        "status": "success",
        "message": "User account rejected permanently",
        "user_status": user.status
    }
