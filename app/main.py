from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TransactionAccount, Transaction, TransactionBreakdown, Tag, TagAssignedToTransaction
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi.security import OAuth2PasswordBearer
from app.auth import create_access_token, decode_access_token, is_admin, hash_password, verify_password

# Initialize FastAPI app
app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login/")

# Pydantic schemas for validation and response models
class UserCreate(BaseModel):
    user_name: str
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    user_name: str
    email: str

    class Config:
        from_attributes = True

class TransactionAccountCreate(BaseModel):
    account_name: str
    balance: float

class TransactionAccountResponse(BaseModel):
    transaction_account_id: int
    account_name: str
    balance: float

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    transaction_name: str
    amount: float
    net_amount: float
    date: datetime  # Use this format for date strings "2024-12-21 12:00:00+02:00"

class TransactionUpdate(BaseModel):
    transaction_name: str = None
    amount: float = None
    net_amount: float = None
    date: datetime = None

class TransactionResponse(BaseModel):
    transaction_id: int
    transaction_name: str
    amount: float
    net_amount: float
    date: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()  # Serialize datetime as ISO 8601 string
        }
        from_attributes = True

class TagCreate(BaseModel):
    tag_name: str

class TagResponse(BaseModel):
    tag_id: int
    tag_name: str

    class Config:
        from_attributes = True

class TagAssign(BaseModel):
    transaction_id: int
    tag_id: int

class AuthRequest(BaseModel):
    user_name: Optional[str] = None
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str

# Dependency to get the current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    return user

# Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the Fein Prototype API"}

@app.post("/auth/register/", response_model=AuthResponse)
def register(auth_request: AuthRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == auth_request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and create new user
    hashed_password = hash_password(auth_request.password)
    new_user = User(
        user_name=auth_request.user_name,
        email=auth_request.email,
        password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return access token
    access_token = create_access_token({"sub": new_user.user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login/", response_model=AuthResponse)
def login(auth_request: AuthRequest, db: Session = Depends(get_db)):
    # Verify email and password
    user = db.query(User).filter(User.email == auth_request.email).first()
    if not user or not verify_password(auth_request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Return access token
    access_token = create_access_token({"sub": user.user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/admin/accounts/", response_model=List[TransactionAccountResponse])
def admin_get_all_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not is_admin(user.email):
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(TransactionAccount).all()


@app.post("/accounts/", response_model=TransactionAccountResponse)
def create_account(account: TransactionAccountCreate, db: Session = Depends(get_db)):
    new_account = TransactionAccount(account_name=account.account_name, balance=account.balance)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@app.get("/accounts/", response_model=List[TransactionAccountResponse])
def get_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(TransactionAccount).filter(TransactionAccount.user_id == user.user_id).all()

@app.post("/transactions/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    new_transaction = Transaction(
        transaction_name=transaction.transaction_name,
        amount=transaction.amount,
        net_amount=transaction.net_amount,
        date=transaction.date
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

@app.get("/transactions/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    
    # Convert datetime fields to strings manually
    return [
        {
            **transaction.__dict__,
            "date": transaction.date.isoformat()  # Convert datetime to ISO 8601 string
        }
        for transaction in transactions
    ]

@app.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, transaction_update: TransactionUpdate, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in transaction_update.dict(exclude_unset=True).items():
        setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return transaction

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

@app.get("/reports/", response_model=dict)
def get_reports(db: Session = Depends(get_db)):
    total_spent = db.query(Transaction).with_entities(Transaction.amount).filter(Transaction.amount > 0).all()
    return {"report": "Reports feature placeholder"}

@app.post("/tags/", response_model=TagResponse)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    new_tag = Tag(tag_name=tag.tag_name)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag

@app.get("/tags/", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).all()
    return tags

@app.post("/tags/assign/", response_model=dict)
def assign_tag_to_transaction(tag_assign: TagAssign, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == tag_assign.transaction_id).first()
    tag = db.query(Tag).filter(Tag.tag_id == tag_assign.tag_id).first()

    if not transaction or not tag:
        raise HTTPException(status_code=404, detail="Transaction or Tag not found")

    assignment = TagAssignedToTransaction(transaction_id=tag_assign.transaction_id, tag_id=tag_assign.tag_id)
    db.add(assignment)
    db.commit()
    return {"message": "Tag assigned to transaction successfully"}

@app.get("/transactions/{transaction_id}/tags", response_model=List[TagResponse])
def get_transaction_tags(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction.tags