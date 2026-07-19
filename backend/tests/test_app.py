import os
os.environ["DATABASE_URL"]="sqlite:///./test.db"
from fastapi.testclient import TestClient
from app.core import engine
from app.models import Base
from app.main import app

def setup_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
def test_auth_flow():
    setup_db()
    c = TestClient(app)
    # Register
    res = c.post("/auth/register", json={"name": "Auth User", "email": "auth@example.com", "password": "password123"})
    assert res.status_code == 201
    assert "access_token" in res.json()
    
    # Duplicate email
    res2 = c.post("/auth/register", json={"name": "Auth User2", "email": "auth@example.com", "password": "password123"})
    assert res2.status_code == 409
    
    # Login
    res3 = c.post("/auth/login", json={"email": "auth@example.com", "password": "password123"})
    assert res3.status_code == 200
    assert "access_token" in res3.json()
    
    # Wrong password
    res4 = c.post("/auth/login", json={"email": "auth@example.com", "password": "wrongpassword"})
    assert res4.status_code == 401

def test_csv_validation():
    setup_db()
    c = TestClient(app)
    t = c.post("/auth/register", json={"name": "User", "email": "test2@example.com", "password": "password123"}).json()["access_token"]
    h = {"Authorization": f"Bearer {t}"}
    
    # Missing header
    res = c.post("/upload/orders", headers=h, files={"file": ("orders.csv", b"amount,currency\n10,USD")})
    assert res.status_code == 422
    assert "Required: amount, currency, and an order identifier" in res.json()["detail"]
    
    # Missing values inside rows
    res2 = c.post("/upload/orders", headers=h, files={"file": ("orders.csv", b"order_id,amount,currency,status\n,10,USD,completed")})
    assert res2.status_code == 200
    assert res2.json()["errors"] == 1
    
    # Invalid amount inside row
    res3 = c.post("/upload/orders", headers=h, files={"file": ("orders.csv", b"order_id,amount,currency,status\nA1,abc,USD,completed")})
    assert res3.status_code == 200
    assert res3.json()["errors"] == 1

def test_reconciliation_rules():
    setup_db()
    c = TestClient(app)
    t = c.post("/auth/register", json={"name": "User", "email": "test3@example.com", "password": "password123"}).json()["access_token"]
    h = {"Authorization": f"Bearer {t}"}
    
    orders_csv = b"""order_id,amount,currency,status\nO1,10.00,USD,completed\nO2,10.00,USD,completed\nO2,10.00,USD,completed\nO4,10.00,USD,completed\nO5,10.00,USD,cancelled\nO6,10.00,USD,refunded\nO7,10.00,USD,completed\nO8,10.00,USD,completed\nO9,10.00,USD,completed\nO10,10.00,USD,completed\nO11,10.00,USD,pending\nO12,10.00,USD,completed\nO13,10.00,USD,completed\n"""
    payments_csv = b"""order_id,payment_id,amount,currency,status,fee,settled_amount\nO1,P1,10.00,USD,succeeded,0.00,10.00\nO2,P2,10.00,USD,succeeded,0.00,10.00\nO3,P3,10.00,USD,succeeded,0.00,10.00\nO5,P5,10.00,USD,succeeded,0.00,10.00\nO6,P6,10.00,USD,succeeded,0.00,10.00\nO7,P7,10.00,USD,failed,0.00,10.00\nO8,P8,10.00,EUR,succeeded,0.00,10.00\nO9,P9,10.00,USD,succeeded,1.00,8.00\nO10,P10,9.00,USD,succeeded,0.00,9.00\nO11,P11,10.00,USD,succeeded,0.00,10.00\nO12,P12A,5.00,USD,succeeded,0.00,5.00\nO12,P12B,5.00,USD,succeeded,0.00,5.00\nO13,P13,5.00,USD,succeeded,0.00,5.00\nO13,P13,5.00,USD,succeeded,0.00,5.00\n"""

    o = c.post("/upload/orders", headers=h, files={"file": ("orders.csv", orders_csv)}).json()
    p = c.post("/upload/payments", headers=h, files={"file": ("payments.csv", payments_csv)}).json()
    
    assert o["errors"] == 0
    assert p["errors"] == 0
    
    res = c.post("/reconciliation/run", headers=h, json={"orders_dataset_id": o["dataset_id"], "payments_dataset_id": p["dataset_id"]}).json()
    
    classifications = {r["match_key"]: r["classification"] for r in res}
    assert classifications["o1"] == "matched"
    assert classifications["o2"] == "duplicate_order"
    assert classifications["o3"] == "payment_without_order"
    assert classifications["o4"] == "missing_payment"
    assert classifications["o5"] == "cancelled_order"
    assert classifications["o6"] == "refunded_order"
    assert classifications["o7"] == "failed_payment"
    assert classifications["o8"] == "currency_mismatch"
    assert classifications["o9"] == "settlement_mismatch"
    assert classifications["o10"] == "amount_mismatch"
    assert classifications["o11"] == "status_mismatch"
    assert classifications["o12"] == "multiple_payments"
    assert classifications["o13"] == "duplicate_payment"
