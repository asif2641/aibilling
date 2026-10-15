import pytest
from decimal import Decimal
from app.models.category import Category

def test_discrepancy_detection_and_vendor_client_breakdown(client, auth_headers, db_session):
    # 1. Setup category
    cat = Category(
        id="cat-grocery-uuid",
        user_id="user-test-uuid-1",
        name="Groceries",
        color="#10B981",
        icon="shopping-cart",
        is_default=True
    )
    db_session.add(cat)
    db_session.commit()

    # 2. Approve Bill 1: Has missing price on one item ("Bread" price is 0.00)
    bill1_payload = {
        "vendor_name": "Metro Cash & Carry",
        "customer_name": "Muhammad Usman",
        "category_id": cat.id,
        "invoice_number": "METRO-101",
        "invoice_date": "2026-10-10",
        "subtotal": 500.00,
        "discount": 0.00,
        "tax": 0.00,
        "total": 500.00,
        "items": [
            {
                "name": "Milk",
                "quantity": 2.0,
                "unit_price": 250.00,
                "line_total": 500.00
            },
            {
                "name": "Bread",
                "quantity": 1.0,
                "unit_price": 0.00,      # Missing / 0 price
                "line_total": 0.00
            }
        ]
    }
    res1 = client.post("/api/v1/invoices/approve", headers=auth_headers, json=bill1_payload)
    assert res1.status_code == 201
    data1 = res1.json()
    assert data1["has_discrepancy"] is True
    assert data1["discrepancy_count"] >= 1
    assert any("Bread" in note and "missing price" in note for note in data1["discrepancy_notes"])
    metro_vendor_id = data1["vendor"]["id"]
    customer_id = data1["customer"]["id"]

    # 3. Approve Bill 2: Has grand total mismatch (calculated 1000, entered 1200)
    bill2_payload = {
        "vendor_name": "Metro Cash & Carry",
        "customer_name": "Muhammad Usman",
        "category_id": cat.id,
        "invoice_number": "METRO-102",
        "invoice_date": "2026-10-11",
        "subtotal": 1000.00,
        "discount": 0.00,
        "tax": 0.00,
        "total": 1200.00,                # Wrong total!
        "items": [
            {
                "name": "Cooking Oil 5L",
                "quantity": 1.0,
                "unit_price": 1000.00,
                "line_total": 1000.00
            }
        ]
    }
    res2 = client.post("/api/v1/invoices/approve", headers=auth_headers, json=bill2_payload)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["has_discrepancy"] is True
    assert any("differs from" in note or "differs" in note for note in data2["discrepancy_notes"])

    # 4. Approve Bill 3: Clean bill with exact math and all prices set
    bill3_payload = {
        "vendor_name": "Al-Fatah Electronics",
        "customer_name": "Fatima Zahra",
        "category_id": cat.id,
        "invoice_number": "ALF-501",
        "invoice_date": "2026-10-12",
        "subtotal": 2000.00,
        "discount": 100.00,
        "tax": 300.00,
        "total": 2200.00,               # Exact math: 2000 - 100 + 300 = 2200
        "items": [
            {
                "name": "LED Bulb",
                "quantity": 4.0,
                "unit_price": 500.00,
                "line_total": 2000.00
            }
        ]
    }
    res3 = client.post("/api/v1/invoices/approve", headers=auth_headers, json=bill3_payload)
    assert res3.status_code == 201
    data3 = res3.json()
    assert data3["has_discrepancy"] is False
    assert data3["discrepancy_count"] == 0

    # 5. Ledger Filter Test: Filter by has_discrepancy=true
    disc_list_res = client.get("/api/v1/invoices?has_discrepancy=true", headers=auth_headers)
    assert disc_list_res.status_code == 200
    disc_data = disc_list_res.json()
    assert disc_data["total"] == 2
    assert disc_data["incorrect_count"] == 2
    assert disc_data["clean_count"] == 1
    assert all(inv["has_discrepancy"] is True for inv in disc_data["items"])

    # Filter by has_discrepancy=false (clean bills)
    clean_list_res = client.get("/api/v1/invoices?has_discrepancy=false", headers=auth_headers)
    assert clean_list_res.status_code == 200
    clean_data = clean_list_res.json()
    assert clean_data["total"] == 1
    assert clean_data["items"][0]["invoice_number"] == "ALF-501"

    # 6. Vendor Breakdown Test: Check Metro Cash & Carry has 2 incorrect bills
    vendors_res = client.get("/api/v1/vendors", headers=auth_headers)
    assert vendors_res.status_code == 200
    vendors_list = vendors_res.json()
    metro_v = next(v for v in vendors_list if v["id"] == metro_vendor_id)
    assert metro_v["total_invoices"] == 2
    assert metro_v["incorrect_invoices_count"] == 2

    # Vendor Detail check
    metro_detail_res = client.get(f"/api/v1/vendors/{metro_vendor_id}", headers=auth_headers)
    assert metro_detail_res.status_code == 200
    metro_detail = metro_detail_res.json()
    assert metro_detail["incorrect_invoices_count"] == 2
    assert all(inv["has_discrepancy"] is True for inv in metro_detail["invoices"])

    # 7. Customer / Client Breakdown Test: Check Muhammad Usman has 2 incorrect bills
    customers_res = client.get("/api/v1/customers", headers=auth_headers)
    assert customers_res.status_code == 200
    cust_list = customers_res.json()
    usman_c = next(c for c in cust_list if c["id"] == customer_id)
    assert usman_c["total_invoices"] == 2
    assert usman_c["incorrect_invoices_count"] == 2

    # Customer Detail check
    usman_detail_res = client.get(f"/api/v1/customers/{customer_id}", headers=auth_headers)
    assert usman_detail_res.status_code == 200
    usman_detail = usman_detail_res.json()
    assert usman_detail["incorrect_invoices_count"] == 2
    assert all(inv["has_discrepancy"] is True for inv in usman_detail["invoices"])

    # 8. Dashboard Summary Test: Ensure incorrect_bills_count is 2
    dash_res = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_bills"] == 3
    assert dash_data["incorrect_bills_count"] == 2
