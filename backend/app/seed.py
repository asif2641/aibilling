import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from PIL import Image, ImageDraw, ImageFont

from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.category import Category
from app.models.vendor import Vendor
from app.models.customer import Customer
from app.models.document import Document, ExtractionField
from app.models.invoice import Invoice, InvoiceItem
from app.core.security import get_password_hash
from app.core.config import settings
import os

def create_sample_receipt_image(path: str, title: str, items: list, subtotal: str, tax: str, total: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = Image.new("RGB", (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw border & simulated receipt paper
    draw.rectangle([20, 20, 580, 780], outline=(220, 220, 220), width=2)
    
    # Header
    draw.text((200, 50), title, fill=(20, 20, 20))
    draw.text((220, 80), "Commercial Area, Lahore", fill=(100, 100, 100))
    draw.text((230, 100), "Tel: 042-35889900", fill=(100, 100, 100))
    draw.text((220, 120), "NTN: 3819204-7 | STRN: 03-09", fill=(100, 100, 100))
    draw.line([(40, 150), (560, 150)], fill=(200, 200, 200), width=1)

    # Metadata
    draw.text((40, 165), f"Date: {date.today().strftime('%d-%m-%Y')}", fill=(50, 50, 50))
    draw.text((400, 165), "Inv #: INV-1025", fill=(50, 50, 50))
    draw.line([(40, 195), (560, 195)], fill=(200, 200, 200), width=1)

    # Items Header
    draw.text((40, 210), "ITEM", fill=(40, 40, 40))
    draw.text((320, 210), "QTY", fill=(40, 40, 40))
    draw.text((400, 210), "PRICE", fill=(40, 40, 40))
    draw.text((500, 210), "TOTAL", fill=(40, 40, 40))
    draw.line([(40, 235), (560, 235)], fill=(180, 180, 180), width=1)

    # Items
    y = 250
    for name, qty, price, line_tot in items:
        draw.text((40, y), name, fill=(30, 30, 30))
        draw.text((330, y), str(qty), fill=(30, 30, 30))
        draw.text((400, y), str(price), fill=(30, 30, 30))
        draw.text((500, y), str(line_tot), fill=(30, 30, 30))
        y += 35

    draw.line([(40, y + 10), (560, y + 10)], fill=(200, 200, 200), width=1)
    y += 25

    # Totals
    draw.text((350, y), f"Subtotal:     Rs. {subtotal}", fill=(50, 50, 50))
    y += 25
    draw.text((350, y), f"GST (18%):    Rs. {tax}", fill=(50, 50, 50))
    y += 30
    draw.rectangle([340, y - 5, 560, y + 25], fill=(245, 245, 245))
    draw.text((350, y), f"GRAND TOTAL:  Rs. {total}", fill=(10, 10, 10))

    # Footer
    y += 70
    draw.text((180, y), "Thank you for your purchase!", fill=(120, 120, 120))
    draw.text((190, y + 25), "*** Customer Copy ***", fill=(140, 140, 140))

    img.save(path, "JPEG", quality=90)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    demo_email = "demo@billintel.com"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=demo_email,
            hashed_password=get_password_hash("Demo12345!"),
            full_name="Demo User",
            currency="PKR"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Categories
    cats = [
        {"name": "Grocery & Food", "color": "#10B981", "icon": "shopping-cart"},
        {"name": "Restaurant & Dining", "color": "#F59E0B", "icon": "utensils"},
        {"name": "Medicine & Pharmacy", "color": "#EF4444", "icon": "activity"},
        {"name": "Utilities & Bills", "color": "#3B82F6", "icon": "zap"},
        {"name": "Electronics & Tech", "color": "#8B5CF6", "icon": "cpu"},
    ]
    cat_map = {}
    for c in cats:
        existing = db.query(Category).filter(Category.user_id == user.id, Category.name == c["name"]).first()
        if not existing:
            new_cat = Category(
                id=str(uuid.uuid4()),
                user_id=user.id,
                name=c["name"],
                color=c["color"],
                icon=c["icon"],
                is_default=True
            )
            db.add(new_cat)
            db.flush()
            cat_map[c["name"]] = new_cat
        else:
            cat_map[c["name"]] = existing

    # Vendors
    vendors_data = [
        {"name": "ABC Super Store", "phone": "042-35889900", "address": "Gulberg, Lahore", "ntn": "3819204-7"},
        {"name": "Metro Cash & Carry", "phone": "042-111786111", "address": "Thokar Niaz Baig, Lahore", "ntn": "1298492-1"},
        {"name": "Cafe Aylanto", "phone": "042-35751886", "address": "M.M. Alam Road, Lahore", "ntn": "4029182-3"},
        {"name": "Fazal Din's Pharma Plus", "phone": "0300-0456789", "address": "DHA Phase 5, Lahore", "ntn": "1489201-2"},
        {"name": "LESCO Electricity", "phone": "118", "address": "Headquarters, Lahore", "ntn": "0812930-0"},
    ]
    ven_map = {}
    for v in vendors_data:
        norm = v["name"].strip().lower()
        existing = db.query(Vendor).filter(Vendor.user_id == user.id, Vendor.normalized_name == norm).first()
        if not existing:
            new_v = Vendor(
                id=str(uuid.uuid4()),
                user_id=user.id,
                name=v["name"],
                normalized_name=norm,
                phone=v["phone"],
                address=v["address"],
                ntn=v["ntn"]
            )
            db.add(new_v)
            db.flush()
            ven_map[v["name"]] = new_v
        else:
            ven_map[v["name"]] = existing

    # Sample Invoices
    today = date.today()
    sample_invoices = [
        {
            "vendor": "ABC Super Store",
            "cat": "Grocery & Food",
            "number": "INV-1025",
            "date": today - timedelta(days=2),
            "subtotal": Decimal("1000.00"),
            "tax": Decimal("180.00"),
            "total": Decimal("1180.00"),
            "items": [
                ("Milk 1L Pack", Decimal("2.0"), Decimal("250.00"), Decimal("500.00")),
                ("Bread Loaf", Decimal("1.0"), Decimal("180.00"), Decimal("180.00")),
                ("Eggs 1 Dozen", Decimal("1.0"), Decimal("320.00"), Decimal("320.00")),
            ]
        },
        {
            "vendor": "Cafe Aylanto",
            "cat": "Restaurant & Dining",
            "number": "TBL-8921",
            "date": today - timedelta(days=4),
            "subtotal": Decimal("4850.00"),
            "tax": Decimal("776.00"),
            "total": Decimal("6111.00"),
            "items": [
                ("Grilled Moroccan Chicken", Decimal("2.0"), Decimal("1650.00"), Decimal("3300.00")),
                ("Caesar Salad", Decimal("1.0"), Decimal("850.00"), Decimal("850.00")),
                ("Fresh Mint Lemonade", Decimal("2.0"), Decimal("350.00"), Decimal("700.00")),
            ]
        },
        {
            "vendor": "Fazal Din's Pharma Plus",
            "cat": "Medicine & Pharmacy",
            "number": "PH-9910",
            "date": today - timedelta(days=6),
            "subtotal": Decimal("1670.00"),
            "tax": Decimal("0.00"),
            "total": Decimal("1586.50"),
            "items": [
                ("Panadol Extra 500mg", Decimal("2.0"), Decimal("120.00"), Decimal("240.00")),
                ("Augmentin 625mg", Decimal("1.0"), Decimal("980.00"), Decimal("980.00")),
                ("Surbex Z", Decimal("1.0"), Decimal("450.00"), Decimal("450.00")),
            ]
        },
        {
            "vendor": "Metro Cash & Carry",
            "cat": "Grocery & Food",
            "number": "METRO-4019",
            "date": today - timedelta(days=12),
            "subtotal": Decimal("12500.00"),
            "tax": Decimal("2250.00"),
            "total": Decimal("14750.00"),
            "items": [
                ("Basmati Rice 10kg", Decimal("1.0"), Decimal("4500.00"), Decimal("4500.00")),
                ("Cooking Oil 5L", Decimal("2.0"), Decimal("2600.00"), Decimal("5200.00")),
                ("Detergent 6kg", Decimal("1.0"), Decimal("2800.00"), Decimal("2800.00")),
            ]
        },
        {
            "vendor": "LESCO Electricity",
            "cat": "Utilities & Bills",
            "number": "BILL-0926-881",
            "date": today - timedelta(days=18),
            "subtotal": Decimal("18400.00"),
            "tax": Decimal("3312.00"),
            "total": Decimal("21712.00"),
            "items": [
                ("Electricity Consumption 340 Units", Decimal("1.0"), Decimal("18400.00"), Decimal("18400.00"))
            ]
        }
    ]

    for inv_data in sample_invoices:
        existing = db.query(Invoice).filter(Invoice.user_id == user.id, Invoice.invoice_number == inv_data["number"]).first()
        if not existing:
            inv_id = str(uuid.uuid4())
            inv = Invoice(
                id=inv_id,
                user_id=user.id,
                vendor_id=ven_map[inv_data["vendor"]].id,
                category_id=cat_map[inv_data["cat"]].id,
                invoice_number=inv_data["number"],
                invoice_date=inv_data["date"],
                currency="PKR",
                subtotal=inv_data["subtotal"],
                tax=inv_data["tax"],
                total=inv_data["total"],
                payment_method="Cash",
                verification_status="VERIFIED"
            )
            db.add(inv)
            for idx, (name, qty, price, total) in enumerate(inv_data["items"]):
                db.add(InvoiceItem(
                    id=str(uuid.uuid4()),
                    invoice_id=inv_id,
                    item_order=idx,
                    name=name,
                    quantity=qty,
                    unit_price=price,
                    line_total=total
                ))

    # Also create a document in REVIEW_REQUIRED state with a real sample image!
    review_doc_id = "doc-demo-review-01"
    existing_doc = db.query(Document).filter(Document.id == review_doc_id).first()
    if not existing_doc:
        storage_rel_path = f"{user.id}/{review_doc_id}.jpg"
        full_storage_path = os.path.join(settings.STORAGE_LOCAL_PATH, storage_rel_path)
        
        # Generate the physical image file
        create_sample_receipt_image(
            path=full_storage_path,
            title="ABC Super Store",
            items=[
                ("Milk 1L", 2, "250.00", "500.00"),
                ("Bread Loaf", 1, "180.00", "180.00"),
                ("Eggs 1 Dozen", 1, "320.00", "320.00"),
            ],
            subtotal="1000.00",
            tax="180.00",
            total="1180.00"
        )

        doc = Document(
            id=review_doc_id,
            user_id=user.id,
            storage_provider="local",
            storage_key=storage_rel_path,
            original_filename="supermarket_bill_sample.jpg",
            mime_type="image/jpeg",
            file_size=os.path.getsize(full_storage_path),
            sha256_checksum="dummy-demo-checksum-01",
            document_type="retail_receipt",
            status="REVIEW_REQUIRED",
            page_count=1
        )
        db.add(doc)

        # Extraction fields for review
        db.add(ExtractionField(
            document_id=review_doc_id,
            field_name="vendor_name",
            field_value="ABC Super Store",
            confidence=0.99,
            source_text="ABC Super Store",
            bounding_box={"x": 0.25, "y": 0.05, "width": 0.50, "height": 0.04}
        ))
        db.add(ExtractionField(
            document_id=review_doc_id,
            field_name="invoice_number",
            field_value="INV-1025",
            confidence=0.98,
            source_text="INV-1025",
            bounding_box={"x": 0.15, "y": 0.12, "width": 0.35, "height": 0.025}
        ))
        db.add(ExtractionField(
            document_id=review_doc_id,
            field_name="total",
            field_value="1180.00",
            confidence=0.99,
            source_text="GRAND TOTAL: Rs. 1180",
            bounding_box={"x": 0.55, "y": 0.42, "width": 0.35, "height": 0.03}
        ))

    db.commit()
    db.close()
    print("Database successfully seeded with realistic sample bills!")

if __name__ == "__main__":
    seed()
