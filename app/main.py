from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TransactionAccount, Transaction, TransactionBreakdown, Tag, TagAssignedToTransaction
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi.security import OAuth2PasswordBearer
from app.auth import create_access_token, decode_access_token, is_admin, hash_password, verify_password
from sqlalchemy import func, literal_column, select

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

class TransactionBreakdownResponse(BaseModel):
    transaction_account_id: int
    earned_amount: float
    spent_amount: float

    class Config:
        from_attributes = True

class TransactionCreateRequest(BaseModel):
    transaction_name: str
    amount: float = 0.0  # Default to 0 if not provided
    date: Optional[datetime] = None  # Default to None, will use current time if not provided
    tag_id: Optional[int] = None  # Optional tag
    target_account_id: int  # Mandatory target account
    breakdowns: Optional[List[TransactionBreakdownResponse]] = None  # Optional list of breakdowns


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
def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    """
    Retrieves the current user based on the access token.
    """
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail="Invalid authentication credentials", 
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return user
    except Exception as e:
        print(f"Error decoding token or fetching user: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Invalid authentication credentials", 
            headers={"WWW-Authenticate": "Bearer"}
        )

# Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the Fein Prototype API"}

@app.post("/auth/register/", response_model=AuthResponse)
def register(
    auth_request: AuthRequest, 
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == auth_request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )

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
    access_token = create_access_token({"sub": new_user.user_id, "email": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login/", response_model=AuthResponse)
def login(
    auth_request: AuthRequest, 
    db: Session = Depends(get_db)
):
    # Verify email and password
    user = db.query(User).filter(User.email == auth_request.email).first()
    if not user or not verify_password(auth_request.password, user.password):
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password"
        )

    # Return access token
    access_token = create_access_token({"sub": user.user_id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/admin/accounts/", response_model=List[TransactionAccountResponse])
def admin_get_all_accounts(
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Admin can fetch all transaction accounts.
    """
    if not is_admin(user.email):
        raise HTTPException(
            status_code=403, 
            detail="Access denied"
        )
    return db.query(TransactionAccount).all()


@app.post("/accounts/", response_model=TransactionAccountResponse)
def create_account(
    account: TransactionAccountCreate, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    new_account = TransactionAccount(
        account_name=account.account_name, 
        balance=account.balance, 
        user_id=user.user_id
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@app.get("/accounts/", response_model=List[TransactionAccountResponse])
def get_accounts(
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Admin can fetch all accounts, regular users only their accounts.
    """
    query = db.query(TransactionAccount)

    if is_admin(user.email):
        return query.all()
    
    return query.filter(TransactionAccount.user_id == user.user_id).all()
        

@app.post("/transactions/", response_model=TransactionResponse)
def create_transaction(
    transaction_request: TransactionCreateRequest, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Admins can create transactions for any account; regular users only for their accounts.
    Create a transaction and associate it with the user's accounts via breakdowns.
    """
    # Admin bypasses ownership checks
    if not is_admin(user.email):
        # Validate target account ownership
        target_account = db.query(TransactionAccount).filter(
            TransactionAccount.transaction_account_id == transaction_request.target_account_id,
            TransactionAccount.user_id == user.user_id
        ).first()
        if not target_account:
            raise HTTPException(
                status_code=403, 
                detail="Access denied to target account."
            )

    # Create transaction
    new_transaction = Transaction(
        transaction_name=transaction_request.transaction_name,
        amount=transaction_request.amount,
        net_amount=0.0,  # Will be updated based on breakdowns
        date=transaction_request.date or datetime.utcnow(),  # Use current UTC time if not provided
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    # Associate a tag, if provided
    if transaction_request.tag_id:
        tag = db.query(Tag).filter(Tag.tag_id == transaction_request.tag_id).first()
        if tag:
            tag_assignment = TagAssignedToTransaction(
                transaction_id=new_transaction.transaction_id,
                tag_id=tag.tag_id
            )
            db.add(tag_assignment)

    # Add breakdowns
    net_amount = 0.0
    if transaction_request.breakdowns:
        for breakdown in transaction_request.breakdowns:
            # Validate breakdown account ownership
            breakdown_account = db.query(TransactionAccount).filter(
                TransactionAccount.transaction_account_id == breakdown.transaction_account_id,
                TransactionAccount.user_id == user.user_id
            ).first()
            if not breakdown_account:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied to breakdown account {breakdown.transaction_account_id}."
                )

            # Create breakdown
            new_breakdown = TransactionBreakdown(
                transaction_id=new_transaction.transaction_id,
                transaction_account_id=breakdown.transaction_account_id,
                earned_amount=breakdown.earned_amount,
                spent_amount=breakdown.spent_amount
            )
            db.add(new_breakdown)

            # Calculate net amount
            net_amount += breakdown.earned_amount - breakdown.spent_amount

    # Update transaction's net amount
    new_transaction.net_amount = net_amount
    db.commit()
    db.refresh(new_transaction)

    return new_transaction

@app.get("/transactions/", response_model=List[TransactionResponse])
def get_transactions(
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Fetch transactions based on user role, excluding placeholder transactions.
    - Admin: Fetch all non-placeholder transactions.
    - Regular User: Fetch non-placeholder transactions tied to the user's accounts via transaction breakdowns.
    """
    query = db.query(Transaction)
    
    if is_admin(user.email):
        # Admins see all non-placeholder transactions
        transactions = (
            query
            .filter(~Transaction.transaction_name.like("Tag_%_placeholder"))
            .all()
        )
    else:
        transactions = (
            query
            .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
            .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
            .filter(TransactionAccount.user_id == user.user_id)
            .filter(~Transaction.transaction_name.like("Tag_%_placeholder"))  # Exclude placeholders
            .all()
        )

    return [
        {
            **transaction.__dict__,
            "date": transaction.date.isoformat()  # Convert datetime to ISO 8601 string
        }
        for transaction in transactions
    ]

@app.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction_by_id(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a single transaction by its ID, ensuring access is restricted
    to the transaction creator or an admin user.
    """
    # If the user is an admin, they can access any transaction
    if is_admin(user.email):
        transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
        if not transaction:
            raise HTTPException(
                status_code=404, 
                detail="Transaction not found."
            )
        return transaction
    
    # Otherwise, restrict access to the transaction creator
    transaction = (
        db.query(Transaction)
        .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
        .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
        .filter(Transaction.transaction_id == transaction_id)
        .filter(TransactionAccount.user_id == user.user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(
            status_code=404, 
            detail="Transaction not found or access denied."
        )
    
    return transaction

@app.get("/transactions/{transaction_id}/breakdowns", response_model=List[TransactionBreakdownResponse])
def get_transaction_breakdowns(
    transaction_id: int, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Fetch transaction breakdowns for a specific transaction.
    """
    breakdowns = (
        db.query(TransactionBreakdown)
        .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
        .filter(TransactionBreakdown.transaction_id == transaction_id)
        .filter(TransactionAccount.user_id == user.user_id)
        .all()
    )

    if not breakdowns:
        raise HTTPException(
            status_code=404, 
            detail="No breakdowns found for this transaction."
        )

    return breakdowns


@app.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Admins can update any transaction
    Regular users update a transaction only if it belongs to the logged-in user.
    """
    query = db.query(Transaction)
    
    if is_admin(user.email):
        transaction = (
            query
            .filter(Transaction.transaction_id == transaction_id)
            .first()
        )
        if not transaction:
            raise HTTPException(
                status_code=404, 
                detail="Transaction not found."
            )
    else:
        transaction = (
            query
            .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
            .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
            .filter(Transaction.transaction_id == transaction_id)
            .filter(TransactionAccount.user_id == user.user_id)
            .first()
        )
        if not transaction:
            raise HTTPException(
                status_code=404, 
                detail="Transaction not found or access denied."
            )

    # Update transaction fields
    for key, value in transaction_update.dict(exclude_unset=True).items():
        setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return transaction

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admins can delete any transaction
    Regular users can delete a transaction only if it belongs to the logged-in user.
    """
    query = db.query(Transaction)

    if is_admin(user.email):
        transaction = (
            query
            .filter(Transaction.transaction_id == transaction_id)
            .first()
        )
        if not transaction:
            raise HTTPException(
                status_code=404, 
                detail="Transaction not found."
            )
    else:
        transaction = (
            query
            .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
            .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
            .filter(Transaction.transaction_id == transaction_id)
            .filter(TransactionAccount.user_id == user.user_id)
            .first()
        )
        if not transaction:
            raise HTTPException(
                status_code=404, 
                detail="Transaction not found or access denied."
            )

    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}


@app.post("/tags/", response_model=TagResponse)
def create_tag(
    tag: TagCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a tag associated with the logged-in user by linking it to a placeholder transaction.
    """
    # Create the tag
    new_tag = Tag(tag_name=tag.tag_name)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)

    # Create a dummy transaction linked to the user's first account
    user_account = (
        db.query(TransactionAccount)
        .filter(TransactionAccount.user_id == user.user_id)
        .first()
    )
    if not user_account:
        raise HTTPException(
            status_code=403, 
            detail="No account available to associate with the tag."
        )

    # Associate the tag with a dummy transaction for the user
    dummy_transaction = Transaction(
        transaction_name=f"Tag_{new_tag.tag_id}_placeholder",
        amount=0,
        net_amount=0,
        date=datetime.utcnow(),
    )
    db.add(dummy_transaction)
    db.commit()
    db.refresh(dummy_transaction)

    # Link the dummy transaction to the user's account
    dummy_breakdown = TransactionBreakdown(
        transaction_id=dummy_transaction.transaction_id,
        transaction_account_id=user_account.transaction_account_id,
        earned_amount=0,
        spent_amount=0,
    )
    db.add(dummy_breakdown)

    # Associate the tag with the dummy transaction
    tag_assignment = TagAssignedToTransaction(
        transaction_id=dummy_transaction.transaction_id,
        tag_id=new_tag.tag_id,
    )
    db.add(tag_assignment)
    db.commit()

    return new_tag

@app.get("/tags/", response_model=List[TagResponse])
def get_tags(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admins can fetch all tags
    Regular users can retrieve tags accessible to the logged-in user based on their transactions.
    """
    if is_admin(user.email):
        return db.query(Tag).all()

    accessible_tags = (
        db.query(Tag)
        .join(TagAssignedToTransaction, Tag.tag_id == TagAssignedToTransaction.tag_id)
        .join(Transaction, TagAssignedToTransaction.transaction_id == Transaction.transaction_id)
        .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
        .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
        .filter(TransactionAccount.user_id == user.user_id)
        .distinct()
        .all()
    )
    return accessible_tags

@app.post("/tags/assign/", response_model=dict)
def assign_tag_to_transaction(
    tag_assign: TagAssign,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a tag to a transaction.
    - Admins can assign any tag to any transaction.
    - Regular users can assign a tag if:
        - The transaction belongs to them.
        - The tag is accessible (created by them or linked to their transactions).
    """
    # Ensure the transaction belongs to the logged-in user
    transaction = (
        db.query(Transaction)
        .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
        .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
        .filter(Transaction.transaction_id == tag_assign.transaction_id)
        .filter(TransactionAccount.user_id == user.user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found or access denied.")

    # Ensure the tag is accessible to the logged-in user
    tag_accessible = (
        db.query(Tag)
        .join(TagAssignedToTransaction, Tag.tag_id == TagAssignedToTransaction.tag_id, isouter=True)
        .join(Transaction, TagAssignedToTransaction.transaction_id == Transaction.transaction_id, isouter=True)
        .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id, isouter=True)
        .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id, isouter=True)
        .filter(Tag.tag_id == tag_assign.tag_id)
        .filter(
            (TransactionAccount.user_id == user.user_id) |  # Tag linked to the user's transactions
            (TransactionAccount.user_id.is_(None))         # Newly created tag not yet assigned
        )
        .first()
    )
    if not tag_accessible:
        raise HTTPException(
            status_code=404, 
            detail="Access denied to the tag."
        )
    
    # Check if the tag is already assigned to the transaction
    existing_assignment = (
        db.query(TagAssignedToTransaction)
        .filter(
            TagAssignedToTransaction.transaction_id == tag_assign.transaction_id,
            TagAssignedToTransaction.tag_id == tag_assign.tag_id,
        )
        .first()
    )
    if existing_assignment:
        raise HTTPException(
            status_code=400, 
            detail="Tag already assigned to this transaction."
        )

    # Assign the tag to the transaction
    assignment = TagAssignedToTransaction(
        transaction_id=tag_assign.transaction_id,
        tag_id=tag_assign.tag_id,
    )
    db.add(assignment)
    db.commit()

    return {"message": "Tag assigned to transaction successfully"}

@app.get("/tags/transaction/{transaction_id}", response_model=List[TagResponse])
def get_transaction_tags_for_user(
    transaction_id: int, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Retrieve tags for a specific transaction.
    - Admins can retrieve tags for any transaction.
    - Regular users can retrieve tags if the transaction belongs to them.
    """
    # Admins can access tags for any transaction
    if is_admin(user.email):
        tags = (
            db.query(Tag)
            .join(TagAssignedToTransaction, Tag.tag_id == TagAssignedToTransaction.tag_id)
            .filter(TagAssignedToTransaction.transaction_id == transaction_id)
            .all()
        )
        return tags
    
    # Check if the transaction belongs to the user
    transaction = (
        db.query(Transaction)
        .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
        .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
        .filter(Transaction.transaction_id == transaction_id)
        .filter(TransactionAccount.user_id == user.user_id)
        .first()
    )
    if not transaction:
        raise HTTPException(
            status_code=403, 
            detail="Access denied"
        )
    
    # Retrieve tags for the transaction
    tags = (
        db.query(Tag)
        .join(TagAssignedToTransaction, Tag.tag_id == TagAssignedToTransaction.tag_id)
        .filter(TagAssignedToTransaction.transaction_id == transaction_id)
        .all()
    )

    return tags

@app.get("/reports/total-spending", response_model=dict)
def get_total_spending(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate and return total spending for the logged-in user.
    - Admins can view total spending for all users.
    """
    try:
        query = db.query(
                func
                .sum(Transaction.amount)
                .label("total_spent")
            )

        if is_admin(user.email):
            # Admin: Total spending for all users
            total_spent = (
                query
                .filter(Transaction.amount > 0)
                .scalar()
            )
        else:
            # Regular User: Total spending for their accounts
            total_spent = (
                query
                .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
                .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
                .filter(TransactionAccount.user_id == user.user_id)
                .filter(Transaction.amount > 0)
                .scalar()
            )

        return {"total_spent": total_spent or 0.0}
    except Exception as e:
        print(f"Error calculating total spending: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to calculate total spending."
        )
    
@app.get("/reports/spending-by-category", response_model=dict)
def get_spending_by_category(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate and return spending grouped by category (tags) for the logged-in user.
    - Admins can view spending by category for all users.
    """
    try:
        # Base query
        query = db.query(
            Tag.tag_name,
            func.sum(Transaction.amount).label("total_spent")
        ).join(
            TagAssignedToTransaction, Tag.tag_id == TagAssignedToTransaction.tag_id
        ).join(
            Transaction, TagAssignedToTransaction.transaction_id == Transaction.transaction_id
        ).filter(
            Transaction.amount > 0  # Include only positive amounts
        )

        # Apply filters for regular users
        if not is_admin(user.email):
            query = query.join(
                TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id
            ).join(
                TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id
            ).filter(
                TransactionAccount.user_id == user.user_id
            )

        # Group by tag and calculate the total spending for each category
        spending_by_category = query.group_by(Tag.tag_name).all()

        # Prepare the response as a dictionary
        response = {row.tag_name: float(row.total_spent or 0) for row in spending_by_category}
        return {"spending_by_category": response}

    except Exception as e:
        print(f"Error calculating spending by category: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to calculate spending by category."
        )

@app.get("/reports/spending-by-date-range", response_model=dict)
def get_spending_by_date_range(
    start_date: str, # Expecting date in 'YYYY-MM-DD' format
    end_date: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate and return spending within a specified date range for the logged-in user.
    - Admins can view spending within the date range for all users.
    """
    try:
        # Convert input dates to `datetime`
        start_date_parsed = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_parsed = datetime.strptime(end_date, "%Y-%m-%d")

        # Query base
        query = db.query(func.sum(Transaction.amount).label("total_spent"))

        if is_admin(user.email):
            # Admin: Total spending for all users within the date range
            total_spent = (
                query
                .filter(
                    Transaction.date >= start_date_parsed,
                    Transaction.date <= end_date_parsed,
                    Transaction.amount > 0
                )
                .scalar()
            )
        else:
            # Regular User: Total spending within the date range for their accounts
            total_spent = (
                query
                .join(TransactionBreakdown, Transaction.transaction_id == TransactionBreakdown.transaction_id)
                .join(TransactionAccount, TransactionBreakdown.transaction_account_id == TransactionAccount.transaction_account_id)
                .filter(
                    TransactionAccount.user_id == user.user_id,
                    Transaction.date >= start_date_parsed,
                    Transaction.date <= end_date_parsed,
                    Transaction.amount > 0
                )
                .scalar()
            )

        # Return result
        return {"total_spent": total_spent or 0.0}
    except Exception as e:
        print(f"Error calculating spending by date range: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate spending by date range."
        )

@app.get("/reports/exceeding-transactions", response_model=List[dict])
def get_exceeding_transactions(
    account_name: Optional[str] = None,  # Allow filtering by account name
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of transactions that exceeded the balance of an account, sorted chronologically.
    - Admins can view for all users.
    - Regular users can view for their own accounts.
    """
    # Define the subquery to calculate `calculated_balance` using a window function
    subquery = (
        db.query(
            Transaction.transaction_id,
            Transaction.transaction_name,
            Transaction.date.label("transaction_date"),
            TransactionAccount.account_name,
            User.user_id,
            User.user_name,
            TransactionBreakdown.spent_amount.label("transaction_amount"),
            func.sum(TransactionBreakdown.earned_amount - TransactionBreakdown.spent_amount)
            .over(
                partition_by=TransactionBreakdown.transaction_account_id,
                order_by=Transaction.date
            )
            .label("calculated_balance"),
        )
        .join(TransactionAccount, TransactionAccount.transaction_account_id == TransactionBreakdown.transaction_account_id)
        .join(User, TransactionAccount.user_id == User.user_id)
        .join(Transaction, Transaction.transaction_id == TransactionBreakdown.transaction_id)
        .subquery()
    )

    query = db.query(
        subquery.c.transaction_id,
        subquery.c.transaction_name,
        subquery.c.transaction_date,
        subquery.c.account_name,
        subquery.c.user_id,
        subquery.c.user_name,
        subquery.c.transaction_amount,
        subquery.c.calculated_balance,
    ).filter(
        subquery.c.transaction_amount > subquery.c.calculated_balance,  # Filter where transaction amount exceeds balance
        subquery.c.transaction_amount > 0,  # Filter for positive transactions
    )

    if account_name:
        query = query.filter(subquery.c.account_name == account_name)

    # Apply user-specific filtering for non-admins
    if not is_admin(user.email):
        query = query.filter(subquery.c.user_id == user.user_id)

    # Order results
    query = query.order_by(
        subquery.c.user_id,
        subquery.c.account_name,
        subquery.c.transaction_date.desc(),
    )

    # Execute the query and fetch results
    results = query.all()

    if not results:
        return []

    # Prepare response
    response = [
        {
            "user_id": row.user_id,
            "user_name": row.user_name,
            "account_name": row.account_name,
            "transaction_id": row.transaction_id,
            "transaction_name": row.transaction_name,
            "transaction_amount": row.transaction_amount,
            "transaction_date": row.transaction_date,
            "calculated_balance": row.calculated_balance,
        }
        for row in results
    ]

    return response

