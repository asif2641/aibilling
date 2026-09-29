import io

MOCK_JPEG = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00\xFF\xD9"

def test_idor_prevent_unauthorized_document_access(client, auth_headers, other_auth_headers):
    # User A uploads a document
    file_payload = ("confidential_bill.jpg", io.BytesIO(MOCK_JPEG), "image/jpeg")
    res_a = client.post("/api/v1/documents/upload", headers=auth_headers, files={"file": file_payload})
    assert res_a.status_code == 202
    doc_id = res_a.json()["id"]

    # User B attempts to access User A's document
    res_b = client.get(f"/api/v1/documents/{doc_id}", headers=other_auth_headers)
    assert res_b.status_code == 404
    assert "Document not found" in res_b.json()["detail"]

    # User B attempts to stream User A's document file binary
    stream_res = client.get(f"/api/v1/documents/{doc_id}/file", headers=other_auth_headers)
    assert stream_res.status_code == 404

def test_idor_prevent_unauthorized_invoice_access_and_mutation(client, auth_headers, other_auth_headers):
    # User A creates an invoice
    res_a = client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Private Contractor",
        "invoice_number": "PRIV-001",
        "invoice_date": "2026-09-20",
        "total": 50000.00,
        "items": []
    })
    assert res_a.status_code == 201
    inv_id = res_a.json()["id"]

    # User B attempts to read User A's invoice
    res_b_get = client.get(f"/api/v1/invoices/{inv_id}", headers=other_auth_headers)
    assert res_b_get.status_code == 404

    # User B attempts to update User A's invoice
    res_b_put = client.put(f"/api/v1/invoices/{inv_id}", headers=other_auth_headers, json={
        "total": 1.00
    })
    assert res_b_put.status_code == 404

    # User B attempts to delete User A's invoice
    res_b_del = client.delete(f"/api/v1/invoices/{inv_id}", headers=other_auth_headers)
    assert res_b_del.status_code == 404

    # Verify User A's invoice is intact
    res_a_verify = client.get(f"/api/v1/invoices/{inv_id}", headers=auth_headers)
    assert res_a_verify.status_code == 200
    assert float(res_a_verify.json()["total"]) == 50000.00
