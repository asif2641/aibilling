import pytest
from decimal import Decimal

def test_user_profile_update(client, auth_headers):
    # Update profile
    res = client.patch("/api/v1/auth/me", headers=auth_headers, json={
        "full_name": "Tariq Mahmood",
        "currency": "USD"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Tariq Mahmood"
    assert data["currency"] == "USD"

    # Reset back to PKR
    client.patch("/api/v1/auth/me", headers=auth_headers, json={
        "currency": "PKR"
    })

def test_category_crud_and_validation(client, auth_headers):
    # 1. Create custom category
    res_create = client.post("/api/v1/categories", headers=auth_headers, json={
        "name": "Stationery & Books",
        "color": "#14B8A6",
        "icon": "briefcase"
    })
    assert res_create.status_code == 201
    cat_id = res_create.json()["id"]
    assert res_create.json()["name"] == "Stationery & Books"
    assert res_create.json()["is_default"] is False

    # 2. Update category
    res_update = client.put(f"/api/v1/categories/{cat_id}", headers=auth_headers, json={
        "name": "Office Supplies & Books",
        "color": "#06B6D4"
    })
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Office Supplies & Books"
    assert res_update.json()["color"] == "#06B6D4"

    # 3. Delete category
    res_del = client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert res_del.status_code == 204

    # Verify deleted from list
    res_list = client.get("/api/v1/categories", headers=auth_headers)
    assert not any(c["id"] == cat_id for c in res_list.json())

def test_customer_management_flow(client, auth_headers):
    # Create invoice with customer details
    inv_res = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Al-Razi Lab",
        "invoice_number": "LAB-7721",
        "invoice_date": "2026-09-28",
        "customer_name": "Fatima Zahra",
        "customer_phone": "0300-1122334",
        "customer_email": "fatima@example.com",
        "total": 3500.00,
        "items": []
    })
    assert inv_res.status_code == 201

    # Fetch customers
    res_custs = client.get("/api/v1/customers", headers=auth_headers)
    assert res_custs.status_code == 200
    custs = res_custs.json()
    fatima = next((c for c in custs if c["name"] == "Fatima Zahra"), None)
    assert fatima is not None
    assert fatima["phone"] == "0300-1122334"
    assert fatima["total_invoices"] >= 1
    assert float(fatima["total_spend"]) >= 3500.00

    # Fetch single customer detail
    cust_id = fatima["id"]
    res_detail = client.get(f"/api/v1/customers/{cust_id}", headers=auth_headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["name"] == "Fatima Zahra"
    assert len(detail["invoices"]) >= 1

    # Update customer info
    res_edit = client.put(f"/api/v1/customers/{cust_id}", headers=auth_headers, json={
        "address": "DHA Phase 5, Lahore"
    })
    assert res_edit.status_code == 200
    assert res_edit.json()["address"] == "DHA Phase 5, Lahore"

def test_idempotent_invoice_approval(client, auth_headers):
    # Approve bill once with document_id
    payload = {
        "document_id": "test-doc-idempotent-01",
        "vendor_name": "Idempotent Store",
        "invoice_number": "IDEM-001",
        "invoice_date": "2026-09-28",
        "total": 500.00,
        "items": [{"name": "Item A", "quantity": 1, "unit_price": 500, "line_total": 500}]
    }

    res1 = client.post("/api/v1/invoices/approve", headers=auth_headers, json=payload)
    assert res1.status_code == 201
    inv_id_1 = res1.json()["id"]

    # Approve same document again with updated total and items
    payload["total"] = 650.00
    payload["items"] = [{"name": "Item A Modified", "quantity": 1, "unit_price": 650, "line_total": 650}]
    res2 = client.post("/api/v1/invoices/approve", headers=auth_headers, json=payload)
    assert res2.status_code == 201
    inv_id_2 = res2.json()["id"]

    # IDs must match (updated, not duplicated!)
    assert inv_id_1 == inv_id_2
    assert float(res2.json()["total"]) == 650.00
    assert len(res2.json()["items"]) == 1
    assert res2.json()["items"][0]["name"] == "Item A Modified"
