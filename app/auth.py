import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from passlib.hash import bcrypt
from dotenv import load_dotenv
import os

load_dotenv()

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.verify(password, hashed_password)

def is_admin(email: str) -> bool:
    return email in {os.getenv('AUTH_ADMIN_EMAILS')}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes= {os.getenv('AUTH_ACCESS_TOKEN_EXPIRE_MINUTES')})
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, {os.getenv('AUTH_SECRET_KEY')}, algorithm={os.getenv('AUTH_ALGORITHM')})
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, {os.getenv('AUTH_SECRET_KEY')}, algorithms=[{os.getenv('AUTH_ALGORITHM')}])
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
