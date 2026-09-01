import os
import datetime
import hashlib
import json
import base64
import secrets
import uuid
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Vendor, VerificationToken

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
except ImportError:
    pass

SECRET_KEY = os.getenv("SECRET_KEY", "rebid_enterprise_procurement_secret_key_2026_fallback")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

def create_verification_record(db: Session, user_id: str, purpose: str = "email_verification", expires_hours: int = 24) -> str:
    token_string = generate_verification_token()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=expires_hours)
    
    verification_token = VerificationToken(
        id=f"VT-{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        token_string=token_string,
        purpose=purpose,
        expires_at=expires_at,
        used=False
    )
    db.add(verification_token)
    db.commit()
    
    return token_string

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(hours=24))
    to_encode.update({"exp": int(expire.timestamp())})
    
    # Try using PyJWT if available, otherwise secure custom token signature
    try:
        import jwt
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception:
        # Fallback JWT format: header.payload.signature
        header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
        payload = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
        signature = hashlib.sha256(f"{header}.{payload}.{SECRET_KEY}".encode()).hexdigest()
        return f"{header}.{payload}.{signature}"

def decode_token(token: str) -> dict:
    try:
        import jwt
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid token format")
        header, payload, sig = parts
        expected_sig = hashlib.sha256(f"{header}.{payload}.{SECRET_KEY}".encode()).hexdigest()
        if sig != expected_sig:
            raise HTTPException(status_code=401, detail="Invalid token signature")
        
        # Add padding back if necessary
        padded_payload = payload + "=" * (-len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded_payload.encode()).decode())
        if "exp" in data and datetime.datetime.utcnow().timestamp() > data["exp"]:
            raise HTTPException(status_code=401, detail="Token expired")
        return data

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication credentials missing")
    return decode_token(credentials.credentials)

def require_role(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Access forbidden for role {user_role}")
        return current_user
    return role_checker

def require_approved_role(allowed_roles: list):
    """Like require_role, but also re-checks the user's CURRENT approval status
    against the database rather than trusting the (potentially stale) JWT claim,
    so a rejected/pending account can't keep acting on a token issued before rejection."""
    def approved_role_checker(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Access forbidden for role {user_role}")
        if user_role != "ADMIN":
            user = db.query(User).filter(User.id == current_user.get("user_id")).first()
            if not user or user.status != "approved":
                raise HTTPException(status_code=403, detail="Account is not approved for this action")
        return current_user
    return approved_role_checker
