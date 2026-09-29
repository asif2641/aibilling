import io
import pytest

# Minimal valid JPEG binary header
MOCK_JPEG_BYTES = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00\xFF\xD9"

def test_upload_valid_document(client, auth_headers):
    file_payload = ("test_receipt.jpg", io.BytesIO(MOCK_JPEG_BYTES), "image/jpeg")
    response = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload}
    )
    assert response.status_code == 202
    data = response.json()
    assert "id" in data
    assert data["original_filename"] == "test_receipt.jpg"
    assert data["mime_type"] == "image/jpeg"
    assert data["duplicate_detected"] is False

def test_upload_invalid_magic_bytes(client, auth_headers):
    # Executable byte header
    malicious_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
    file_payload = ("malware.exe", io.BytesIO(malicious_bytes), "image/jpeg")
    response = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_duplicate_document_detection(client, auth_headers):
    # Upload first time
    file_payload = ("bill.jpg", io.BytesIO(MOCK_JPEG_BYTES), "image/jpeg")
    res1 = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload}
    )
    assert res1.status_code == 202
    doc1_id = res1.json()["id"]

    # First approve invoice for doc1 so binary link exists
    client.post(
        "/api/v1/invoices/approve",
        headers=auth_headers,
        json={
            "document_id": doc1_id,
            "vendor_name": "ABC Super Store",
            "invoice_number": "INV-1025",
            "invoice_date": "2026-09-25",
            "total": 1180.00,
            "items": []
        }
    )

    # Re-upload exact same file binary
    file_payload_dup = ("bill_copy.jpg", io.BytesIO(MOCK_JPEG_BYTES), "image/jpeg")
    res2 = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload_dup}
    )
    assert res2.status_code == 202
    data2 = res2.json()
    assert data2["duplicate_detected"] is True

def test_get_document_detail_and_review(client, auth_headers):
    file_payload = ("pharmacy_receipt.jpg", io.BytesIO(MOCK_JPEG_BYTES), "image/jpeg")
    res = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload}
    )
    doc_id = res.json()["id"]

    # Fetch detail
    detail_res = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == doc_id
    assert detail["extraction"] is not None
    assert "vendor_name" in detail["extraction"]
    assert "items" in detail["extraction"]

def test_stream_document_file(client, auth_headers):
    file_payload = ("stream_test.jpg", io.BytesIO(MOCK_JPEG_BYTES), "image/jpeg")
    res = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload}
    )
    doc_id = res.json()["id"]

    stream_res = client.get(f"/api/v1/documents/{doc_id}/file", headers=auth_headers)
    assert stream_res.status_code == 200
    assert stream_res.content == MOCK_JPEG_BYTES
