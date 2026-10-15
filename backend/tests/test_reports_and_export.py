from datetime import date

def test_dashboard_summary_and_reports(client, auth_headers):
    today_str = date.today().strftime("%Y-%m-%d")
    # Create test invoices across categories
    client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Grocery Store",
        "invoice_number": "INV-G1",
        "invoice_date": today_str,
        "total": 3500.00,
        "items": []
    })
    client.post("/api/v1/invoices/approve", headers=auth_headers, json={
        "vendor_name": "Electricity Board",
        "invoice_number": "UTIL-10",
        "invoice_date": today_str,
        "total": 8500.00,
        "items": []
    })

    # Dashboard summary
    dash_res = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_bills"] >= 2
    assert float(dash_data["total_spending"]) >= 12000.00
    assert len(dash_data["top_vendors"]) >= 2
    assert len(dash_data["weekly_trend"]) == 4

    # Monthly report
    rep_res = client.get("/api/v1/reports/summary?report_type=monthly", headers=auth_headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["report_type"] == "monthly"
    assert rep_data["total_bills"] >= 2

def test_export_csv_and_excel(client, auth_headers):
    # CSV export
    csv_res = client.get("/api/v1/reports/export?format=csv", headers=auth_headers)
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    csv_text = csv_res.text
    assert "Date,Vendor,Invoice Number" in csv_text

    # Excel export
    xlsx_res = client.get("/api/v1/reports/export?format=xlsx", headers=auth_headers)
    assert xlsx_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in xlsx_res.headers["content-type"]
    assert len(xlsx_res.content) > 100

    # PDF report export
    pdf_res = client.get("/api/v1/reports/export?format=pdf", headers=auth_headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 500
