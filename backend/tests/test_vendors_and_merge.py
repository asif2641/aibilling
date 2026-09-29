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
