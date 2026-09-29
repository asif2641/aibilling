def test_register_user_success(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "Password123!",
        "full_name": "New User",
        "currency": "PKR"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "hashed_password" not in data

def test_register_duplicate_email(client, test_user):
    response = client.post("/api/v1/auth/register", json={
        "email": test_user.email,
        "password": "Password123!",
        "full_name": "Duplicate"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client, test_user):
    response = client.post("/api/v1/auth/login", data={
        "username": test_user.email,
        "password": "SecretPassword123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email

def test_login_invalid_password(client, test_user):
    response = client.post("/api/v1/auth/login", data={
        "username": test_user.email,
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_me(client, auth_headers, test_user):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email

def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
