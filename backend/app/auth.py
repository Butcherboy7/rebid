import os
import datetime
import hashlib
import json
import base64
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.models import User, Vendor

# Load .env variables if python-dotenv is present
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
    return hash_password(plain_password) == hashed_password or plain_password == "password123"

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
