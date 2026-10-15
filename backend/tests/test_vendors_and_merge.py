def test_vendor_aggregation_and_merge(client, auth_headers):
    # Create bills for "ABC Store" and "ABC Super Store"
    client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "ABC Store",
        "invoice_number": "ABC-1",
        "invoice_date": "2026-09-01",
        "total": 1000.00,
        "items": []
    })
    client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "ABC Super Store",
        "invoice_number": "ABC-2",
        "invoice_date": "2026-09-02",
        "total": 2000.00,
        "items": []
    })

    # Check vendor list
    ven_res = client.get("/api/v1/vendors", headers=auth_headers)
    assert ven_res.status_code == 200
    vendors = ven_res.json()
    assert len(vendors) >= 2

    abc_store = next(v for v in vendors if v["name"] == "ABC Store")
    abc_super = next(v for v in vendors if v["name"] == "ABC Super Store")

    # Merge duplicate "ABC Store" into "ABC Super Store"
    merge_res = client.post("/api/v1/vendors/merge", headers=auth_headers, json={
        "primary_vendor_id": abc_super["id"],
        "duplicate_vendor_ids": [abc_store["id"]]
    })
    assert merge_res.status_code == 200
    assert "Successfully merged" in merge_res.json()["message"]

    # Verify that ABC Store is removed, and ABC Super Store now has aggregate spend 3000
    ven_detail = client.get(f"/api/v1/vendors/{abc_super['id']}", headers=auth_headers)
    assert ven_detail.status_code == 200
    data = ven_detail.json()
    assert data["total_invoices"] == 2
    assert float(data["total_spend"]) == 3000.00
    assert len(data["invoices"]) == 2

def test_multiple_bills_linked_to_vendor_and_customer(client, auth_headers):
    """
    Test that when multiple bills exist for the same vendor and/or customer,
    all of those bills are linked and displayed in both the vendor profile
    and the customer profile.
    """
    # 1. Create first bill for Gourmet Foods & customer Usman Ghani
    b1 = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Gourmet Foods",
        "vendor_phone": "042-35889900",
        "invoice_number": "GOUR-101",
        "invoice_date": "2026-10-01",
        "customer_name": "Usman Ghani",
        "customer_phone": "0321-9988776",
        "total": 1500.00,
        "items": [
            {"name": "Cake", "quantity": 1, "unit_price": 1000.00, "line_total": 1000.00},
            {"name": "Biscuits", "quantity": 2, "unit_price": 250.00, "line_total": 500.00}
        ]
    })
    assert b1.status_code == 201
    b1_data = b1.json()

    # 2. Create second bill with slight case variation in vendor and customer
    b2 = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "gourmet foods",
        "invoice_number": "GOUR-102",
        "invoice_date": "2026-10-05",
        "customer_name": "usman ghani",
        "customer_phone": "0321-9988776",
        "total": 2500.00,
        "items": [
            {"name": "Sweets Box", "quantity": 2, "unit_price": 1250.00, "line_total": 2500.00}
        ]
    })
    assert b2.status_code == 201
    b2_data = b2.json()

    # 3. Create third bill for the same vendor
    b3 = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Gourmet Foods",
        "invoice_number": "GOUR-103",
        "invoice_date": "2026-10-10",
        "customer_name": "Usman Ghani",
        "total": 800.00,
        "items": [
            {"name": "Bread", "quantity": 4, "unit_price": 200.00, "line_total": 800.00}
        ]
    })
    assert b3.status_code == 201
    b3_data = b3.json()

    # Check vendor profile - all 3 bills must be attached
    vendor_id = b1_data["vendor_id"]
    assert b2_data["vendor_id"] == vendor_id
    assert b3_data["vendor_id"] == vendor_id

    ven_res = client.get(f"/api/v1/vendors/{vendor_id}", headers=auth_headers)
    assert ven_res.status_code == 200
    vendor_profile = ven_res.json()
    assert vendor_profile["total_invoices"] == 3
    assert float(vendor_profile["total_spend"]) == 4800.00
    assert len(vendor_profile["invoices"]) == 3
    inv_numbers = [inv["invoice_number"] for inv in vendor_profile["invoices"]]
    assert "GOUR-101" in inv_numbers
    assert "GOUR-102" in inv_numbers
    assert "GOUR-103" in inv_numbers

    # Check customer profile - all 3 bills must be attached
    customer_id = b1_data["customer_id"]
    assert b2_data["customer_id"] == customer_id
    assert b3_data["customer_id"] == customer_id

    cust_res = client.get(f"/api/v1/customers/{customer_id}", headers=auth_headers)
    assert cust_res.status_code == 200
    customer_profile = cust_res.json()
    assert customer_profile["total_invoices"] == 3
    assert float(customer_profile["total_spend"]) == 4800.00
    assert len(customer_profile["invoices"]) == 3
    cust_inv_numbers = [inv["invoice_number"] for inv in customer_profile["invoices"]]
    assert "GOUR-101" in cust_inv_numbers
    assert "GOUR-102" in cust_inv_numbers
    assert "GOUR-103" in cust_inv_numbers

    # Test filtering invoices by customer_id
    filter_res = client.get(f"/api/v1/invoices?customer_id={customer_id}", headers=auth_headers)
    assert filter_res.status_code == 200
    filtered_items = filter_res.json()["items"]
    assert len(filtered_items) == 3

