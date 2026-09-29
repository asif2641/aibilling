import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.category import Category
from app.core.security import get_password_hash, create_access_token

# Test SQLite in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user(db_session):
    user = User(
        id="user-test-uuid-1",
        email="ali@example.com",
        hashed_password=get_password_hash("SecretPassword123!"),
        full_name="Ali Khan",
        currency="PKR"
    )
    db_session.add(user)
    # Default category
    cat = Category(
        id="cat-grocery-1",
        user_id="user-test-uuid-1",
        name="Grocery & Food",
        color="#10B981",
        icon="shopping-cart",
        is_default=True
    )
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def other_user(db_session):
    user = User(
        id="user-test-uuid-2",
        email="sarah@example.com",
        hashed_password=get_password_hash("SecretPassword123!"),
        full_name="Sarah Ahmed",
        currency="PKR"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def other_auth_headers(other_user):
    token = create_access_token(other_user.id)
    return {"Authorization": f"Bearer {token}"}
