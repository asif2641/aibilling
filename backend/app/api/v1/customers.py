import uuid
from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.schemas.customer import (
    CustomerResponse, 
    CustomerDetailResponse, 
    CustomerUpdate, 
    CustomerInvoiceItem
)

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    customers = db.query(Customer).filter(Customer.user_id == user_id).all()
    results = []
    for c in customers:
        invs = db.query(Invoice).filter(
            Invoice.customer_id == c.id,
            Invoice.user_id == user_id
        ).all()
        total_invoices = len(invs)
        total_spend = sum((Decimal(str(i.total)) for i in invs), Decimal("0.00"))
        incorrect_invoices = sum(1 for i in invs if i.has_discrepancy)
        sorted_invs = sorted(invs, key=lambda x: str(x.invoice_date), reverse=True)
        last_date = str(sorted_invs[0].invoice_date) if sorted_invs else None

        results.append(CustomerResponse(
            id=c.id,
            name=c.name,
            phone=c.phone,
            email=c.email,
            address=c.address,
            created_at=c.created_at,
            updated_at=c.updated_at,
            total_invoices=total_invoices,
            total_spend=total_spend,
            incorrect_invoices_count=incorrect_invoices,
            last_purchase_date=last_date
        ))
    return results

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer(
    customer_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user_id
    ).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    invs = db.query(Invoice).options(
        joinedload(Invoice.vendor),
        joinedload(Invoice.category),
        joinedload(Invoice.items)
    ).filter(
        Invoice.customer_id == customer.id,
        Invoice.user_id == user_id
    ).order_by(desc(Invoice.invoice_date)).all()

    total_invoices = len(invs)
    total_spend = sum((Decimal(str(i.total)) for i in invs), Decimal("0.00"))
    incorrect_invoices = sum(1 for i in invs if i.has_discrepancy)
    last_date = str(invs[0].invoice_date) if invs else None

    invoice_items = [
        CustomerInvoiceItem(
            id=i.id,
            invoice_number=i.invoice_number,
            invoice_date=str(i.invoice_date),
            total=Decimal(str(i.total)),
            currency=i.currency,
            vendor_name=i.vendor.name if i.vendor else "Unknown",
            vendor_id=i.vendor_id,
            status=i.verification_status,
            category_name=i.category.name if i.category else None,
            items_count=len(i.items) if i.items else 0,
            notes=i.notes,
            document_id=i.document_id,
            has_discrepancy=bool(i.has_discrepancy),
            discrepancy_notes=i.discrepancy_notes or []
        )
        for i in invs
    ]

    return CustomerDetailResponse(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        address=customer.address,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
        total_invoices=total_invoices,
        total_spend=total_spend,
        incorrect_invoices_count=incorrect_invoices,
        last_purchase_date=last_date,
        invoices=invoice_items
    )

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    cust_in: CustomerUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user_id
    ).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    if cust_in.name is not None:
        customer.name = cust_in.name.strip()
    if cust_in.phone is not None:
        customer.phone = cust_in.phone.strip()
    if cust_in.email is not None:
        customer.email = cust_in.email.strip()
    if cust_in.address is not None:
        customer.address = cust_in.address.strip()

    db.commit()
    db.refresh(customer)

    invs = db.query(Invoice).filter(
        Invoice.customer_id == customer.id,
        Invoice.user_id == user_id
    ).all()
    total_invoices = len(invs)
    total_spend = sum((Decimal(str(i.total)) for i in invs), Decimal("0.00"))
    last_date = str(sorted(invs, key=lambda x: str(x.invoice_date), reverse=True)[0].invoice_date) if invs else None

    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        address=customer.address,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
        total_invoices=total_invoices,
        total_spend=total_spend,
        last_purchase_date=last_date
    )

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.user_id == user_id
    ).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    db.query(Invoice).filter(Invoice.customer_id == customer_id).update({"customer_id": None})
    db.delete(customer)
    db.commit()
    return None
