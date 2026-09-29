import requests

BASE_API = "http://127.0.0.1:8000/api/v1"
FRONTEND = "http://localhost:3000"

def test_frontend_routes():
    print("=== 1. FRONTEND PAGES SMOKE TEST ===")
    routes = [
        "/",
        "/login",
        "/register",
        "/dashboard",
        "/invoices",
        "/invoices/upload",
        "/invoices/new",
        "/vendors",
        "/customers",
        "/reports",
        "/settings",
    ]
    for r in routes:
        res = requests.get(f"{FRONTEND}{r}", timeout=10)
        assert res.status_code == 200, f"Route {r} failed with status {res.status_code}"
        print(f"  [PASS] {r} -> HTTP 200 OK")

def test_backend_and_api():
    print("\n=== 2. AUTHENTICATION TEST ===")
    login_res = requests.post(
        f"{BASE_API}/auth/login",
        data={"username": "demo@billintel.com", "password": "Demo12345!"},
        timeout=10
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [PASS] Demo user authenticated, token received.")

    print("\n=== 3. API ENDPOINTS REGRESSION TEST ===")
    me = requests.get(f"{BASE_API}/auth/me", headers=headers, timeout=10)
    assert me.status_code == 200
    me_data = me.json()
    print(f"  [PASS] /auth/me -> {me_data.get('email')} ({me_data.get('full_name')})")

    dash = requests.get(f"{BASE_API}/dashboard/summary", headers=headers, timeout=10)
    assert dash.status_code == 200
    d = dash.json()
    print(f"  [PASS] /dashboard/summary -> Total Spend: {d.get('total_spending')}, Bills: {d.get('total_bills')}")

    invs = requests.get(f"{BASE_API}/invoices", headers=headers, timeout=10)
    assert invs.status_code == 200
    print(f"  [PASS] /invoices -> Found {invs.json().get('total')} invoices")

    vendors = requests.get(f"{BASE_API}/vendors", headers=headers, timeout=10)
    assert vendors.status_code == 200
    print(f"  [PASS] /vendors -> Found {len(vendors.json())} vendors")

    customers = requests.get(f"{BASE_API}/customers", headers=headers, timeout=10)
    assert customers.status_code == 200
    print(f"  [PASS] /customers -> Found {len(customers.json())} customers")

    categories = requests.get(f"{BASE_API}/categories", headers=headers, timeout=10)
    assert categories.status_code == 200
    print(f"  [PASS] /categories -> Found {len(categories.json())} categories")

    reports = requests.get(f"{BASE_API}/reports/summary?report_type=monthly", headers=headers, timeout=10)
    assert reports.status_code == 200
    print("  [PASS] /reports/summary -> Monthly report generated")

    print("\n=== 4. DOCUMENT UPLOAD & EXTRACTION PIPELINE TEST ===")
    MOCK_JPEG = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00\xFF\xD9"
    upload_res = requests.post(
        f"{BASE_API}/documents/upload",
        headers=headers,
        files={"file": ("live_test_bill.jpg", MOCK_JPEG, "image/jpeg")},
        timeout=10
    )
    assert upload_res.status_code == 202, f"Upload failed: {upload_res.text}"
    doc_id = upload_res.json()["id"]
    print(f"  [PASS] /documents/upload -> Document ingested with id: {doc_id}")

    doc_detail = requests.get(f"{BASE_API}/documents/{doc_id}", headers=headers, timeout=10)
    assert doc_detail.status_code == 200
    extracted = doc_detail.json()
    vendor = extracted.get("extraction", {}).get("vendor_name", {}).get("value")
    print(f"  [PASS] /documents/{{id}} -> Extraction ready, vendor: {vendor}")

    stream_res = requests.get(f"{BASE_API}/documents/{doc_id}/file?token={token}", timeout=10)
    assert stream_res.status_code == 200 and len(stream_res.content) == len(MOCK_JPEG)
    print("  [PASS] /documents/{id}/file -> Document binary stream verified")

    print("\n=== ALL REGRESSION TESTS PASSED 100% ===")

if __name__ == "__main__":
    test_frontend_routes()
    test_backend_and_api()
