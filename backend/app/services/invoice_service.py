from decimal import Decimal
import uuid
from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc, asc

from app.models.invoice import Invoice, InvoiceItem
from app.models.vendor import Vendor
from app.models.customer import Customer
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.schemas.invoice import (
    InvoiceVerificationRequest, 
    InvoiceUpdate, 
    InvoiceResponse
)

class InvoiceService:
    @staticmethod
    def get_or_create_vendor(db: Session, user_id: str, name: str, **kwargs) -> Vendor:
        norm_name = name.strip().lower()
        vendor = db.query(Vendor).filter(
            Vendor.user_id == user_id,
            Vendor.normalized_name == norm_name
        ).first()

        if not vendor:
            vendor = Vendor(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=name.strip(),
                normalized_name=norm_name,
                phone=kwargs.get("phone"),
                email=kwargs.get("email"),
                address=kwargs.get("address"),
                tax_id=kwargs.get("tax_id"),
                ntn=kwargs.get("ntn"),
                strn=kwargs.get("strn")
            )
            db.add(vendor)
            db.flush()
        return vendor

    @staticmethod
    def get_or_create_customer(db: Session, user_id: str, name: Optional[str], **kwargs) -> Optional[Customer]:
        if not name or not name.strip():
            return None
        cust = db.query(Customer).filter(
            Customer.user_id == user_id,
            Customer.name == name.strip()
        ).first()

        if not cust:
            cust = Customer(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=name.strip(),
                phone=kwargs.get("phone"),
                email=kwargs.get("email"),
                address=kwargs.get("address")
            )
            db.add(cust)
            db.flush()
        return cust

    @classmethod
    def verify_and_save_invoice(
        cls, 
        user_id: str, 
        req: InvoiceVerificationRequest, 
        db: Session
    ) -> Invoice:
        # 1. Resolve Vendor
        vendor = cls.get_or_create_vendor(
            db=db,
            user_id=user_id,
            name=req.vendor_name,
            phone=req.vendor_phone,
            address=req.vendor_address,
            ntn=req.vendor_ntn,
            strn=req.vendor_strn
        )

        # 2. Resolve Customer (if present, never invent)
        customer = cls.get_or_create_customer(
            db=db,
            user_id=user_id,
            name=req.customer_name,
            phone=req.customer_phone,
            email=req.customer_email,
            address=req.customer_address
        )

        # 3. Create or Update Invoice (Idempotent per document)
        existing_invoice = None
        if req.document_id:
            existing_invoice = db.query(Invoice).filter(
                Invoice.document_id == req.document_id,
                Invoice.user_id == user_id
            ).first()

        if existing_invoice:
            invoice = existing_invoice
            inv_id = invoice.id
            invoice.vendor_id = vendor.id
            invoice.customer_id = customer.id if customer else None
            invoice.category_id = req.category_id
            invoice.invoice_number = req.invoice_number
            invoice.receipt_number = req.receipt_number
            invoice.order_number = req.order_number
            invoice.invoice_date = req.invoice_date
            invoice.due_date = req.due_date
            invoice.currency = req.currency or "PKR"
            invoice.subtotal = req.subtotal
            invoice.discount = req.discount
            invoice.tax = req.tax
            invoice.service_charge = req.service_charge
            invoice.shipping = req.shipping
            invoice.rounding = req.rounding
            invoice.total = req.total
            invoice.amount_paid = req.amount_paid
            invoice.balance_due = req.balance_due
            invoice.payment_method = req.payment_method
            invoice.verification_status = "VERIFIED"
            invoice.custom_fields = req.custom_fields
            invoice.notes = req.notes
            db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv_id).delete()
        else:
            inv_id = str(uuid.uuid4())
            invoice = Invoice(
                id=inv_id,
                user_id=user_id,
                document_id=req.document_id,
                vendor_id=vendor.id,
                customer_id=customer.id if customer else None,
                category_id=req.category_id,
                invoice_number=req.invoice_number,
                receipt_number=req.receipt_number,
                order_number=req.order_number,
                invoice_date=req.invoice_date,
                due_date=req.due_date,
                currency=req.currency or "PKR",
                subtotal=req.subtotal,
                discount=req.discount,
                tax=req.tax,
                service_charge=req.service_charge,
                shipping=req.shipping,
                rounding=req.rounding,
                total=req.total,
                amount_paid=req.amount_paid,
                balance_due=req.balance_due,
                payment_method=req.payment_method,
                confidence_score=1.0,
                verification_status="VERIFIED",
                custom_fields=req.custom_fields,
                notes=req.notes
            )
            db.add(invoice)

        # 4. Create line items
        for idx, item in enumerate(req.items):
            db.add(InvoiceItem(
                id=str(uuid.uuid4()),
                invoice_id=inv_id,
                item_order=idx,
                name=item.name,
                description=item.description,
                sku=item.sku,
                quantity=item.quantity,
                unit=item.unit,
                unit_price=item.unit_price,
                discount=item.discount,
                tax=item.tax,
                line_total=item.line_total,
                confidence=item.confidence,
                bounding_box=item.bounding_box
            ))

        # 5. Update linked document status
        if req.document_id:
            doc = db.query(Document).filter(
                Document.id == req.document_id,
                Document.user_id == user_id
            ).first()
            if doc:
                doc.status = "VERIFIED"

        # 6. Record Audit Log
        db.add(AuditLog(
            user_id=user_id,
            action="VERIFY",
            entity_type="invoice",
            entity_id=inv_id,
            after_state={"total": str(req.total), "vendor": vendor.name}
        ))

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get_invoices(
        db: Session,
        user_id: str,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        vendor_id: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        min_total: Optional[Decimal] = None,
        max_total: Optional[Decimal] = None,
        sort_by: str = "invoice_date",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Invoice], int, Decimal]:
        query = db.query(Invoice).options(
            joinedload(Invoice.vendor),
            joinedload(Invoice.customer),
            joinedload(Invoice.category),
            joinedload(Invoice.items)
        ).filter(Invoice.user_id == user_id)

        # Filters
        if start_date:
            query = query.filter(Invoice.invoice_date >= start_date)
        if end_date:
            query = query.filter(Invoice.invoice_date <= end_date)
        if vendor_id:
            query = query.filter(Invoice.vendor_id == vendor_id)
        if category_id:
            query = query.filter(Invoice.category_id == category_id)
        if status:
            query = query.filter(Invoice.verification_status == status)
        if min_total is not None:
            query = query.filter(Invoice.total >= min_total)
        if max_total is not None:
            query = query.filter(Invoice.total <= max_total)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.outerjoin(Vendor).outerjoin(Customer).filter(
                or_(
                    Invoice.invoice_number.ilike(term),
                    Vendor.name.ilike(term),
                    Customer.name.ilike(term),
                    Invoice.notes.ilike(term)
                )
            )

        total_count = query.count()
        total_sum_query = db.query(func.coalesce(func.sum(Invoice.total), Decimal("0.00"))).filter(
            Invoice.id.in_([i.id for i in query.all()])
        )
        total_spend = total_sum_query.scalar() or Decimal("0.00")

        # Sorting
        sort_column = getattr(Invoice, sort_by, Invoice.invoice_date)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Pagination
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total_count, total_spend
