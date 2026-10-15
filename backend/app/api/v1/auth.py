import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    get_current_user_id
)
from app.models.user import User
from app.models.category import Category
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate

router = APIRouter()

DEFAULT_CATEGORIES = [
    {"name": "Grocery & Food", "color": "#10B981", "icon": "shopping-cart"},
    {"name": "Restaurant & Dining", "color": "#F59E0B", "icon": "utensils"},
    {"name": "Medicine & Pharmacy", "color": "#EF4444", "icon": "activity"},
    {"name": "Utilities & Bills", "color": "#3B82F6", "icon": "zap"},
    {"name": "Electronics & Tech", "color": "#8B5CF6", "icon": "cpu"},
    {"name": "Office & Supplies", "color": "#6366F1", "icon": "briefcase"},
    {"name": "Household & Repairs", "color": "#EC4899", "icon": "home"},
    {"name": "Travel & Fuel", "color": "#14B8A6", "icon": "compass"},
    {"name": "Other", "color": "#6B7280", "icon": "tag"}
]

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        plain_password=user_in.password,
        full_name=user_in.full_name,
        role="staff",
        currency=user_in.currency or "PKR"
    )
    db.add(user)

    # Seed default categories for this user
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=cat["name"],
            color=cat["color"],
            icon=cat["icon"],
            is_default=True
        ))

    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form_data.username.lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account.")

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.patch("/me", response_model=UserResponse)
@router.put("/me", response_model=UserResponse)
def update_me(
    user_in: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()
    if user_in.currency is not None:
        user.currency = user_in.currency.strip().upper()
    db.commit()
    db.refresh(user)
    return user
