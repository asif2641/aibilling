import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    require_super_admin
)
from app.models.user import User
from app.models.category import Category
from app.schemas.user import StaffCreate, StaffUpdate, StaffDetailResponse
from app.api.v1.auth import DEFAULT_CATEGORIES

router = APIRouter()

@router.get("", response_model=List[StaffDetailResponse])
def list_staff_users(
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin endpoint to list all system users, their roles,
    and assigned passwords.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    
    return [
        StaffDetailResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role or ("super_admin" if u.is_superuser else "staff"),
            is_superuser=u.is_superuser,
            is_active=u.is_active,
            currency=u.currency,
            password_display=u.plain_password or "••••••••",
            created_at=u.created_at,
            last_login_at=u.last_login_at
        )
        for u in users
    ]

@router.post("", response_model=StaffDetailResponse, status_code=status.HTTP_201_CREATED)
def create_staff_user(
    staff_in: StaffCreate,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin endpoint to create new staff accounts with username/email,
    password, full name, and role.
    """
    existing = db.query(User).filter(User.email == staff_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    is_super = staff_in.role == "super_admin"

    new_user = User(
        id=user_id,
        email=staff_in.email.lower(),
        hashed_password=get_password_hash(staff_in.password),
        plain_password=staff_in.password,  # Store visible plain password for Super Admin view & edit
        full_name=staff_in.full_name,
        role=staff_in.role,
        is_superuser=is_super,
        currency=staff_in.currency or "PKR",
        is_active=True
    )
    db.add(new_user)

    # Seed default categories
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
    db.refresh(new_user)

    return StaffDetailResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_superuser=new_user.is_superuser,
        is_active=new_user.is_active,
        currency=new_user.currency,
        password_display=new_user.plain_password,
        created_at=new_user.created_at,
        last_login_at=new_user.last_login_at
    )

@router.put("/{user_id}", response_model=StaffDetailResponse)
def update_staff_user(
    user_id: str,
    staff_in: StaffUpdate,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin endpoint to edit staff username/email, password, role,
    or active status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff user not found.")

    if staff_in.email and staff_in.email.lower() != user.email:
        conflict = db.query(User).filter(User.email == staff_in.email.lower()).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use by another account.")
        user.email = staff_in.email.lower()

    if staff_in.password:
        user.hashed_password = get_password_hash(staff_in.password)
        user.plain_password = staff_in.password

    if staff_in.full_name is not None:
        user.full_name = staff_in.full_name

    if staff_in.role is not None:
        user.role = staff_in.role
        user.is_superuser = (staff_in.role == "super_admin")

    if staff_in.is_active is not None:
        if user.id == current_admin.id and not staff_in.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Super admin cannot deactivate own account.")
        user.is_active = staff_in.is_active

    if staff_in.currency is not None:
        user.currency = staff_in.currency

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return StaffDetailResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_superuser=user.is_superuser,
        is_active=user.is_active,
        currency=user.currency,
        password_display=user.plain_password or "••••••••",
        created_at=user.created_at,
        last_login_at=user.last_login_at
    )

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_staff_user(
    user_id: str,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin endpoint to delete a staff account.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin cannot delete their own account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff user not found.")

    db.delete(user)
    db.commit()

    return {"message": f"Staff account {user.email} successfully removed."}
