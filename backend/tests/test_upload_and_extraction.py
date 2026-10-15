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

def test_multi_image_bill_upload_and_stitch(client, auth_headers):
    from PIL import Image
    # Create two test images representing top half and bottom half of a long bill
    img1 = Image.new("RGB", (300, 200), color=(255, 200, 200))
    buf1 = io.BytesIO()
    img1.save(buf1, format="JPEG")
    b1 = buf1.getvalue()

    img2 = Image.new("RGB", (300, 300), color=(200, 255, 200))
    buf2 = io.BytesIO()
    img2.save(buf2, format="JPEG")
    b2 = buf2.getvalue()

    files = [
        ("files", ("receipt_part1.jpg", io.BytesIO(b1), "image/jpeg")),
        ("files", ("receipt_part2.jpg", io.BytesIO(b2), "image/jpeg"))
    ]

    res = client.post(
        "/api/v1/documents/upload-multi",
        headers=auth_headers,
        files=files
    )
    assert res.status_code == 202
    data = res.json()
    doc_id = data["id"]
    assert "receipt_part1" in data["original_filename"] or "combined" in data["original_filename"]

    # Verify detail has page_count = 2 and pages populated
    detail_res = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["page_count"] == 2
    assert detail["pages"] is not None
    assert len(detail["pages"]) == 2
    assert detail["pages"][0]["page_number"] == 1
    assert detail["pages"][1]["page_number"] == 2

    # Verify pages list endpoint
    pages_res = client.get(f"/api/v1/documents/{doc_id}/pages", headers=auth_headers)
    assert pages_res.status_code == 200
    pages_list = pages_res.json()
    assert len(pages_list) == 2

    # Verify individual page streaming
    p1_file = client.get(f"/api/v1/documents/{doc_id}/pages/1/file", headers=auth_headers)
    assert p1_file.status_code == 200
    assert p1_file.headers["content-type"] == "image/jpeg"

    # Verify composite stitched image streaming
    comp_file = client.get(f"/api/v1/documents/{doc_id}/file", headers=auth_headers)
    assert comp_file.status_code == 200
    assert comp_file.headers["content-type"] == "image/jpeg"
    # Composite should be larger in dimensions
    stitched_img = Image.open(io.BytesIO(comp_file.content))
    assert stitched_img.width == 1000  # clamped minimum width target
    assert stitched_img.height > 1000  # height scaled proportionally

@pytest.mark.asyncio
async def test_multi_page_pdf_upload_and_text_extraction(client, auth_headers, db_session):
    """
    PRD Section 18: Multi-page PDF upload and local text extraction without cloud AI.
    Verifies page count, document pages storage, and local OCR/pypdf extraction.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from app.services.document_service import DocumentService

    # 1. Create a 2-page invoice PDF
    pdf_buf = io.BytesIO()
    c = canvas.Canvas(pdf_buf, pagesize=letter)
    c.drawString(100, 700, "Al-Noor Stationery Mart")
    c.drawString(100, 680, "Invoice: INV-4421")
    c.drawString(100, 660, "Date: 2026-10-15")
    c.drawString(100, 640, "A4 Paper Reams 5 box 1200 6000")
    c.showPage()
    # Page 2
    c.drawString(100, 700, "Ballpoint Pens 20 pcs 50 1000")
    c.drawString(100, 680, "Total: 7000")
    c.showPage()
    c.save()

    pdf_bytes = pdf_buf.getvalue()

    # 2. Upload PDF
    file_payload = ("test_multi_invoice.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    upload_res = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": file_payload}
    )
    assert upload_res.status_code == 202
    doc_id = upload_res.json()["id"]

    # 3. Verify Document metadata and page count = 2
    doc_res = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert doc_res.status_code == 200
    doc_data = doc_res.json()
    assert doc_data["page_count"] == 2
    assert len(doc_data["pages"]) == 2
    assert doc_data["pages"][0]["page_number"] == 1
    assert doc_data["pages"][1]["page_number"] == 2

    # 4. Process extraction pipeline synchronously with test db_session
    await DocumentService.process_extraction_pipeline(doc_id, db_session)

    # 5. Verify extracted review data from local pypdf & UniversalExtractor
    review_res = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert review_res.status_code == 200
    review_data = review_res.json()["extraction"]
    assert "Al-Noor Stationery" in review_data["vendor_name"]["value"]
    assert "INV-4421" in review_data["invoice_number"]["value"]
    assert float(review_data["total"]["value"]) == 7000.0
    assert len(review_data["items"]) >= 1

@pytest.mark.asyncio
async def test_image_quality_blank_page_rejection(client, auth_headers, db_session):
    from PIL import Image
    from app.services.document_service import DocumentService
    from app.models.document import Document

    # Create a 300x300 pure blank white image (larger than 300 bytes)
    img = Image.new("RGB", (300, 300), (255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    blank_bytes = buf.getvalue()
    assert len(blank_bytes) > 300

    upload_res = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("blank_bill.jpg", io.BytesIO(blank_bytes), "image/jpeg")}
    )
    assert upload_res.status_code == 202
    doc_id = upload_res.json()["id"]

    # Process extraction pipeline
    await DocumentService.process_extraction_pipeline(doc_id, db_session)

    # Verify document is rejected early without calling expensive AI/OCR
    doc = db_session.query(Document).filter(Document.id == doc_id).first()
    assert doc.status == "FAILED"
    assert "Image Quality Rejection" in doc.processing_error
    assert "blank" in doc.processing_error.lower()

@pytest.mark.asyncio
async def test_image_quality_pitch_black_rejection(client, auth_headers, db_session):
    from PIL import Image
    from app.services.document_service import DocumentService
    from app.models.document import Document

    # Create a 300x300 pitch-black image (mean brightness < 18)
    img = Image.new("RGB", (300, 300), (3, 3, 3))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    dark_bytes = buf.getvalue()
    assert len(dark_bytes) > 300

    upload_res = client.post(
        "/api/v1/documents/upload",
        headers=auth_headers,
        files={"file": ("dark_bill.jpg", io.BytesIO(dark_bytes), "image/jpeg")}
    )
    assert upload_res.status_code == 202
    doc_id = upload_res.json()["id"]

    # Process extraction pipeline
    await DocumentService.process_extraction_pipeline(doc_id, db_session)

    doc = db_session.query(Document).filter(Document.id == doc_id).first()
    assert doc.status == "FAILED"
    assert "Image Quality Rejection" in doc.processing_error
    assert "dark" in doc.processing_error.lower()

def test_image_quality_service_evaluation():
    from PIL import Image, ImageDraw, ImageFilter
    from app.services.image_quality_service import ImageQualityService

    # 1. Very small image
    tiny_img = Image.new("RGB", (80, 80), (128, 128, 128))
    buf = io.BytesIO()
    tiny_img.save(buf, format="JPEG")
    res_tiny = ImageQualityService.evaluate_image(buf.getvalue(), "image/jpeg")
    assert res_tiny.is_acceptable is False
    assert "resolution is too low" in res_tiny.issues[0]

    # 2. Blurred text image
    sharp_img = Image.new("RGB", (400, 400), (255, 255, 255))
    draw = ImageDraw.Draw(sharp_img)
    draw.rectangle([50, 50, 350, 350], outline=(0, 0, 0), width=4)
    draw.line([(50, 100), (350, 100)], fill=(0, 0, 0), width=3)
    
    # Heavily blur it
    blurred_img = sharp_img.filter(ImageFilter.GaussianBlur(radius=8))
    b_buf = io.BytesIO()
    blurred_img.save(b_buf, format="JPEG", quality=85)
    res_blur = ImageQualityService.evaluate_image(b_buf.getvalue(), "image/jpeg")
    assert res_blur.has_warning is True
    assert any("blurry" in issue.lower() or "focus" in issue.lower() for issue in res_blur.issues)



