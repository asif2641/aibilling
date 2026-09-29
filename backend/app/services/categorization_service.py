import re
from typing import Tuple, Optional, List
from sqlalchemy.orm import Session
from app.models.category import Category

class CategorizationService:
    """
    Intelligent categorization engine that classifies the nature of a bill/invoice
    and assigns the corresponding financial Expense Category.
    """

    MAPPING_RULES = [
        # Medical, Health, Pharmacy & Diagnostic Labs
        {
            "category_name": "Medicine & Pharmacy",
            "document_type": "pharmacy_bill",
            "keywords": [
                "diagnostic", "diagnostic center", "lab", "laboratory", "phc", 
                "patient", "doctor", "dr.", "clinic", "hospital", "medical", 
                "pharmacy", "pharma", "chemist", "test description", "uric acid", 
                "cholesterol", "blood test", "x-ray", "ultrasound", "panadol", 
                "augmentin", "surbex", "medicine", "tablet", "capsule", "syrup",
                "prescription", "specimen", "pathology"
            ]
        },
        # Restaurants, Cafes & Dining
        {
            "category_name": "Restaurant & Dining",
            "document_type": "restaurant_receipt",
            "keywords": [
                "restaurant", "cafe", "bistro", "dining", "kitchen", "fast food", 
                "pizza", "burger", "covers", "table number", "server", "waiter", 
                "steak", "grilled", "chicken", "salad", "lemonade", "coffee", 
                "tea", "lunch", "dinner", "takeaway", "aylanto"
            ]
        },
        # Utilities, Power, Gas, Internet & Telecom
        {
            "category_name": "Utilities & Bills",
            "document_type": "utility_bill",
            "keywords": [
                "lesco", "sngpl", "ptcl", "wapda", "k-electric", "fesco", 
                "iesco", "mepco", "electricity", "gas bill", "water bill", 
                "utility", "tariff", "meter reading", "billing month", 
                "consumer id", "feeder", "connection date"
            ]
        },
        # Electronics, Appliances, Tech & Hardware
        {
            "category_name": "Electronics & Tech",
            "document_type": "retail_receipt",
            "keywords": [
                "fan", "fans", "royal fans", "pak fans", "gfc", "ac/dc", "copper", 
                "exhaust", "exhaust fan", "appliance", "electronics", "hardware", 
                "computer", "laptop", "mobile", "cables", "electric store", 
                "hafiz", "hafiz electric", "wiring", "led bulb", "inverter", 
                "battery", "ups", "motor"
            ]
        },
        # Groceries, Supermarkets & Everyday Marts
        {
            "category_name": "Grocery & Food",
            "document_type": "retail_receipt",
            "keywords": [
                "super store", "supermarket", "grocery", "mart", "cash & carry", 
                "milk", "bread", "eggs", "flour", "sugar", "rice", "dal", 
                "cooking oil", "vegetable", "fruit", "detergent", "soap", "shampoo"
            ]
        },
        # Official Taxes & Government Invoices
        {
            "category_name": "Utilities & Bills",
            "document_type": "tax_invoice",
            "keywords": [
                "fbr", "pra", "sales tax invoice", "tax invoice", "strn", "ntn"
            ]
        }
    ]

    @classmethod
    def infer_category_and_type(
        cls,
        vendor_name: str = "",
        document_text: str = "",
        items: Optional[List[dict]] = None,
        raw_document_type: str = ""
    ) -> Tuple[str, str]:
        """
        Infers (document_type, expense_category_name) based on text content and vendor.
        """
        combined = f"{vendor_name} {document_text}".lower()
        if items:
            for item in items:
                if isinstance(item, dict):
                    combined += f" {item.get('name', '')} {item.get('description', '')}".lower()
                elif hasattr(item, "name"):
                    combined += f" {item.name}".lower()

        # Check each rule
        best_match = None
        best_score = 0

        for rule in cls.MAPPING_RULES:
            score = 0
            for kw in rule["keywords"]:
                if re.search(r"\b" + re.escape(kw) + r"\b", combined):
                    score += 2 if len(kw) > 4 else 1

            if score > best_score:
                best_score = score
                best_match = rule

        if best_match and best_score > 0:
            return best_match["document_type"], best_match["category_name"]

        # Fallback to raw_document_type if valid
        if raw_document_type == "restaurant_receipt":
            return "restaurant_receipt", "Restaurant & Dining"
        elif raw_document_type == "pharmacy_bill":
            return "pharmacy_bill", "Medicine & Pharmacy"
        elif raw_document_type == "utility_bill":
            return "utility_bill", "Utilities & Bills"

        # Default fallback
        return "retail_receipt", "Grocery & Food"

    @classmethod
    def resolve_category_id(cls, category_name: str, db: Session) -> Optional[str]:
        """
        Finds the Category ID in database matching the category name or keywords.
        """
        if not category_name:
            return None

        # 1. Exact match
        cat = db.query(Category).filter(Category.name.ilike(category_name.strip())).first()
        if cat:
            return cat.id

        # 2. Substring or keyword match
        norm = category_name.lower()
        all_cats = db.query(Category).all()
        for c in all_cats:
            c_norm = c.name.lower()
            if "medicine" in norm and "medicine" in c_norm:
                return c.id
            if "pharmacy" in norm and "pharmacy" in c_norm:
                return c.id
            if "dining" in norm and "dining" in c_norm:
                return c.id
            if "restaurant" in norm and "restaurant" in c_norm:
                return c.id
            if "grocer" in norm and "grocer" in c_norm:
                return c.id
            if "food" in norm and "food" in c_norm:
                return c.id
            if "utilit" in norm and "utilit" in c_norm:
                return c.id
            if "electr" in norm and "electr" in c_norm:
                return c.id
            if "tech" in norm and "tech" in c_norm:
                return c.id

        return all_cats[0].id if all_cats else None
