from typing import Optional, List
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.invoice import Invoice, InvoiceItem
from app.models.audit_log import AuditLog
from app.services.invoice_service import InvoiceService
from app.services.validation_service import ValidationService
from app.schemas.invoice import (
    InvoiceVerificationRequest, 
    InvoiceResponse, 
    InvoiceListResponse, 
    InvoiceUpdate
)

router = APIRouter()

@router.post("/approve", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def approve_and_save_invoice(
    req: InvoiceVerificationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    invoice = InvoiceService.verify_and_save_invoice(user_id=user_id, req=req, db=db)
    # Reload with relations
    return db.query(Invoice).options(
        joinedload(Invoice.vendor),
        joinedload(Invoice.customer),
        joinedload(Invoice.category),
        joinedload(Invoice.items)
    ).filter(Invoice.id == invoice.id).first()

@router.get("", response_model=InvoiceListResponse)
def get_invoices(
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    vendor_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    has_discrepancy: Optional[bool] = None,
    min_total: Optional[Decimal] = None,
    max_total: Optional[Decimal] = None,
    sort_by: str = "invoice_date",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    items, total, total_spend, incorrect_count, clean_count = InvoiceService.get_invoices(
        db=db,
        user_id=user_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        vendor_id=vendor_id,
        customer_id=customer_id,
        category_id=category_id,
        status=status,
        has_discrepancy=has_discrepancy,
        min_total=min_total,
        max_total=max_total,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

    return InvoiceListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_spend=total_spend,
        incorrect_count=incorrect_count,
        clean_count=clean_count
    )

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.vendor),
        joinedload(Invoice.customer),
        joinedload(Invoice.category),
        joinedload(Invoice.items)
    ).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == user_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    req: InvoiceUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == user_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    before_state = {"total": str(invoice.total), "invoice_number": invoice.invoice_number}

    # Update vendor if name or ID provided
    if req.vendor_id:
        invoice.vendor_id = req.vendor_id
    elif req.vendor_name and req.vendor_name.strip():
        ven = InvoiceService.get_or_create_vendor(db=db, user_id=user_id, name=req.vendor_name)
        invoice.vendor_id = ven.id

    # Update customer if name or ID provided
    if req.customer_id is not None:
        invoice.customer_id = req.customer_id
    elif req.customer_name and req.customer_name.strip():
        cust = InvoiceService.get_or_create_customer(
            db=db, 
            user_id=user_id, 
            name=req.customer_name,
            phone=req.customer_phone,
            email=req.customer_email,
            address=req.customer_address
        )
        invoice.customer_id = cust.id if cust else None

    for key, val in req.model_dump(exclude_unset=True).items():
        if key in ("items", "vendor_name", "vendor_id", "customer_name", "customer_id", "customer_phone", "customer_email", "customer_address"):
            continue
        if hasattr(invoice, key) and val is not None:
            setattr(invoice, key, val)

    # If items provided, replace
    if req.items is not None:
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).delete()
        for idx, itm in enumerate(req.items):
            db.add(InvoiceItem(
                invoice_id=invoice.id,
                item_order=idx,
                name=itm.name,
                description=itm.description,
                sku=itm.sku,
                quantity=itm.quantity,
                unit=itm.unit,
                unit_price=itm.unit_price,
                discount=itm.discount,
                tax=itm.tax,
                line_total=itm.line_total,
                confidence=itm.confidence,
                bounding_box=itm.bounding_box
            ))

    # Recalculate discrepancies after update
    has_disc, disc_notes = ValidationService.evaluate_invoice_discrepancies(
        subtotal=invoice.subtotal,
        discount=invoice.discount,
        tax=invoice.tax,
        service_charge=invoice.service_charge,
        shipping=invoice.shipping,
        rounding=invoice.rounding,
        total=invoice.total,
        items=invoice.items,
        vendor_name=invoice.vendor.name if invoice.vendor else None
    )
    invoice.has_discrepancy = has_disc
    invoice.discrepancy_count = len(disc_notes)
    invoice.discrepancy_notes = disc_notes

    db.add(AuditLog(
        user_id=user_id,
        action="EDIT",
        entity_type="invoice",
        entity_id=invoice.id,
        before_state=before_state,
        after_state={"total": str(invoice.total), "invoice_number": invoice.invoice_number, "has_discrepancy": has_disc}
    ))
    db.commit()
    db.refresh(invoice)

    return db.query(Invoice).options(
        joinedload(Invoice.vendor),
        joinedload(Invoice.customer),
        joinedload(Invoice.category),
        joinedload(Invoice.items)
    ).filter(Invoice.id == invoice.id).first()

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == user_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    db.add(AuditLog(
        user_id=user_id,
        action="DELETE",
        entity_type="invoice",
        entity_id=invoice.id,
        before_state={"total": str(invoice.total), "invoice_number": invoice.invoice_number}
    ))

    db.delete(invoice)
    db.commit()
    return None
