from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.vendor import Vendor, VendorAlias
from app.models.invoice import Invoice
from app.models.audit_log import AuditLog
from app.schemas.vendor import VendorResponse, VendorMergeRequest

router = APIRouter()

@router.get("", response_model=List[VendorResponse])
def get_vendors(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    vendors = db.query(Vendor).filter(Vendor.user_id == user_id).all()
    results = []

    for v in vendors:
        stats = db.query(
            func.count(Invoice.id),
            func.coalesce(func.sum(Invoice.total), Decimal("0.00")),
            func.max(Invoice.invoice_date)
        ).filter(Invoice.vendor_id == v.id, Invoice.user_id == user_id).first()

        results.append(VendorResponse(
            id=v.id,
            name=v.name,
            normalized_name=v.normalized_name,
            phone=v.phone,
            email=v.email,
            address=v.address,
            website=v.website,
            tax_id=v.tax_id,
            ntn=v.ntn,
            strn=v.strn,
            total_invoices=stats[0] or 0,
            total_spend=stats[1] or Decimal("0.00"),
            last_invoice_date=stats[2].isoformat() if stats[2] else None,
            created_at=v.created_at
        ))

    results.sort(key=lambda x: x.total_spend, reverse=True)
    return results

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    v = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.user_id == user_id).first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    stats = db.query(
        func.count(Invoice.id),
        func.coalesce(func.sum(Invoice.total), Decimal("0.00")),
        func.max(Invoice.invoice_date)
    ).filter(Invoice.vendor_id == v.id, Invoice.user_id == user_id).first()

    return VendorResponse(
        id=v.id,
        name=v.name,
        normalized_name=v.normalized_name,
        phone=v.phone,
        email=v.email,
        address=v.address,
        website=v.website,
        tax_id=v.tax_id,
        ntn=v.ntn,
        strn=v.strn,
        total_invoices=stats[0] or 0,
        total_spend=stats[1] or Decimal("0.00"),
        last_invoice_date=stats[2].isoformat() if stats[2] else None,
        created_at=v.created_at
    )

@router.post("/merge", status_code=status.HTTP_200_OK)
def merge_vendors(
    req: VendorMergeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Merge duplicate vendors per PRD Section 23.
    Reassigns all invoices to primary_vendor_id and creates aliases.
    """
    primary = db.query(Vendor).filter(
        Vendor.id == req.primary_vendor_id, 
        Vendor.user_id == user_id
    ).first()
    if not primary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Primary vendor not found")

    reassigned_count = 0
    for dup_id in req.duplicate_vendor_ids:
        if dup_id == primary.id:
            continue
        dup = db.query(Vendor).filter(Vendor.id == dup_id, Vendor.user_id == user_id).first()
        if not dup:
            continue

        # Create alias
        db.add(VendorAlias(vendor_id=primary.id, alias_name=dup.name))

        # Reassign invoices
        updated = db.query(Invoice).filter(
            Invoice.vendor_id == dup.id, 
            Invoice.user_id == user_id
        ).update({"vendor_id": primary.id})
        reassigned_count += updated

        # Delete duplicate vendor
        db.delete(dup)

    db.add(AuditLog(
        user_id=user_id,
        action="MERGE",
        entity_type="vendor",
        entity_id=primary.id,
        after_state={"reassigned_invoices": reassigned_count}
    ))
    db.commit()

    return {"message": f"Successfully merged vendors. {reassigned_count} invoices reassigned to '{primary.name}'."}
