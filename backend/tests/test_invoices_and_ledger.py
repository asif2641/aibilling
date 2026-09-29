from decimal import Decimal

def test_approve_invoice_and_list(client, auth_headers):
    # Approve invoice
    payload = {
        "vendor_name": "Metro Cash & Carry",
        "vendor_phone": "042-111786111",
        "vendor_address": "Thokar Niaz Baig, Lahore",
        "invoice_number": "METRO-99120",
        "invoice_date": "2026-09-24",
        "currency": "PKR",
        "subtotal": 5000.00,
        "tax": 900.00,
        "total": 5900.00,
        "payment_method": "Credit Card",
        "items": [
            {
                "name": "Cooking Oil 5L",
                "quantity": 2.0,
                "unit": "Can",
                "unit_price": 2500.00,
                "discount": 0.00,
                "tax": 0.00,
                "line_total": 5000.00
            }
        ]
    }

    res = client.post("/api/v1/invoices/approve", headers=auth_headers, json=payload)
    assert res.status_code == 201
    inv_data = res.json()
    assert inv_data["invoice_number"] == "METRO-99120"
    assert float(inv_data["total"]) == 5900.00
    assert inv_data["verification_status"] == "VERIFIED"
    assert len(inv_data["items"]) == 1
    assert inv_data["vendor"]["name"] == "Metro Cash & Carry"

    # Verify listing in invoices ledger
    list_res = client.get("/api/v1/invoices", headers=auth_headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert float(list_data["total_spend"]) >= 5900.00

def test_search_and_filter_invoices(client, auth_headers):
    # Create two distinct invoices
    client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Al-Fatah Electronics",
        "invoice_number": "ELEC-100",
        "invoice_date": "2026-09-10",
        "total": 15000.00,
        "items": []
    })
    client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Gourmet Bakers",
        "invoice_number": "BAKE-200",
        "invoice_date": "2026-09-20",
        "total": 850.00,
        "items": []
    })

    # Search for "Electronics"
    res_search = client.get("/api/v1/invoices?search=Electronics", headers=auth_headers)
    assert res_search.status_code == 200
    items = res_search.json()["items"]
    assert len(items) == 1
    assert items[0]["vendor"]["name"] == "Al-Fatah Electronics"

    # Filter by date range
    res_date = client.get("/api/v1/invoices?start_date=2026-09-15&end_date=2026-09-25", headers=auth_headers)
    assert res_date.status_code == 200
    items_date = res_date.json()["items"]
    assert any(i["invoice_number"] == "BAKE-200" for i in items_date)
    assert not any(i["invoice_number"] == "ELEC-100" for i in items_date)

def test_update_invoice(client, auth_headers):
    res_create = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Pharmacy Shop",
        "invoice_number": "PH-001",
        "invoice_date": "2026-09-20",
        "total": 100.00,
        "items": []
    })
    inv_id = res_create.json()["id"]

    # Update amount and notes
    res_update = client.put(f"/api/v1/invoices/{inv_id}", headers=auth_headers, json={
        "total": 150.00,
        "notes": "Corrected discrepancy after physical inspection"
    })
    assert res_update.status_code == 200
    assert float(res_update.json()["total"]) == 150.00
    assert res_update.json()["notes"] == "Corrected discrepancy after physical inspection"

def test_delete_invoice(client, auth_headers):
    res_create = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Temporary Store",
        "invoice_number": "DEL-999",
        "invoice_date": "2026-09-20",
        "total": 300.00,
        "items": []
    })
    inv_id = res_create.json()["id"]

    res_del = client.delete(f"/api/v1/invoices/{inv_id}", headers=auth_headers)
    assert res_del.status_code == 204

    # Verify deleted
    res_get = client.get(f"/api/v1/invoices/{inv_id}", headers=auth_headers)
    assert res_get.status_code == 404
