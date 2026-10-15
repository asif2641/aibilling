import pytest
from app.models.user import User
from app.core.security import get_password_hash

def test_super_admin_staff_management(client, db_session):
    # Setup Super Admin in test db
    admin = User(
        id="admin-test-uuid-1",
        email="asif2641@gmail.com",
        hashed_password=get_password_hash("asif2641#"),
        plain_password="asif2641#",
        full_name="Asif Mahmood",
        role="super_admin",
        is_superuser=True,
        currency="PKR"
    )
    db_session.add(admin)
    db_session.commit()

    # 1. Login as Super Admin (asif2641@gmail.com)
    admin_login = client.post(
        "/api/v1/auth/login",
        data={"username": "asif2641@gmail.com", "password": "asif2641#"}
    )
    assert admin_login.status_code == 200, f"Failed admin login: {admin_login.text}"
    admin_data = admin_login.json()
    assert admin_data["user"]["role"] == "super_admin"
    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Get list of all staff accounts
    staff_res = client.get("/api/v1/users", headers=admin_headers)
    assert staff_res.status_code == 200
    staff_list = staff_res.json()
    assert any(u["email"] == "asif2641@gmail.com" for u in staff_list)

    # 3. Create a new staff account
    new_staff_payload = {
        "email": "tariq_staff@billintel.com",
        "password": "staffsecret123#",
        "full_name": "Tariq Staff Member",
        "role": "staff"
    }
    create_res = client.post("/api/v1/users", headers=admin_headers, json=new_staff_payload)
    assert create_res.status_code == 201
    created_staff = create_res.json()
    assert created_staff["email"] == "tariq_staff@billintel.com"
    assert created_staff["password_display"] == "staffsecret123#"
    staff_id = created_staff["id"]

    # 4. Verify new staff can log in with the created credentials
    staff_login = client.post(
        "/api/v1/auth/login",
        data={"username": "tariq_staff@billintel.com", "password": "staffsecret123#"}
    )
    assert staff_login.status_code == 200
    staff_token = staff_login.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # 5. Security Boundary Check: Staff cannot access admin user list
    unauthorized_res = client.get("/api/v1/users", headers=staff_headers)
    assert unauthorized_res.status_code == 403

    # 6. Super Admin edits the staff member's password and details
    update_res = client.put(
        f"/api/v1/users/{staff_id}",
        headers=admin_headers,
        json={
            "full_name": "Tariq Khan Updated",
            "password": "updatedpassword789#"
        }
    )
    assert update_res.status_code == 200
    updated_staff = update_res.json()
    assert updated_staff["full_name"] == "Tariq Khan Updated"
    assert updated_staff["password_display"] == "updatedpassword789#"

    # 7. Staff can now log in with the new updated password
    staff_relogin = client.post(
        "/api/v1/auth/login",
        data={"username": "tariq_staff@billintel.com", "password": "updatedpassword789#"}
    )
    assert staff_relogin.status_code == 200

    # 8. Super Admin deletes the test staff account
    delete_res = client.delete(f"/api/v1/users/{staff_id}", headers=admin_headers)
    assert delete_res.status_code == 200
