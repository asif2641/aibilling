import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.category import Category
from app.models.invoice import Invoice
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    categories = db.query(Category).filter(
        or_(Category.user_id == user_id, Category.user_id == None)
    ).all()
    return categories

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cat = Category(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=cat_in.name.strip(),
        color=cat_in.color,
        icon=cat_in.icon,
        is_default=False
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(
        Category.id == category_id,
        or_(Category.user_id == user_id, Category.user_id == None)
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if cat_in.name is not None:
        cat.name = cat_in.name.strip()
    if cat_in.color is not None:
        cat.color = cat_in.color.strip()
    if cat_in.icon is not None:
        cat.icon = cat_in.icon.strip()

    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found or cannot be modified")

    if cat.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Default system categories cannot be deleted."
        )

    # Detach linked invoices to maintain ledger integrity
    db.query(Invoice).filter(Invoice.category_id == category_id).update({"category_id": None})
    db.delete(cat)
    db.commit()
    return None
