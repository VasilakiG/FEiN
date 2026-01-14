import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from passlib.hash import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.verify(password, hashed_password)

def is_admin(email: str) -> bool:
    return email in ["admin@fein.com"]

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes= 30)
    to_encode.update({"exp": expire})

    # Ensure `sub` is a string
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])

    # Add other claims (e.g., email)
    if "email" in to_encode and not isinstance(to_encode["email"], str):
        raise ValueError("Email must be a string")
        
    encoded_jwt = jwt.encode(to_encode, "A1B2C3D4E5F6G7H8I9J0K", algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, "A1B2C3D4E5F6G7H8I9J0K", algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
