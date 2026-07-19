import sys
import os

# Ensure backend app is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core import get_db
from app.models import User, Dataset, Order, Payment, Result
from app.services import import_csv, reconcile

def run():
    db = next(get_db())
    
    # Create a test user if not exists
    user = db.query(User).filter_by(email="admin@test.com").first()
    if not user:
        user = User(name="Admin", email="admin@test.com", password_hash="hash")
        db.add(user)
        db.commit()
        db.refresh(user)
        
    print(f"Using User ID: {user.id}")

    orders_path = "../orders.csv"
    payments_path = "../payments.csv"
    
    with open(orders_path, "rb") as f:
        orders_content = f.read()
        
    with open(payments_path, "rb") as f:
        payments_content = f.read()

    print("Importing orders.csv...")
    od_res = import_csv(db, user.id, "orders", "orders.csv", orders_content)
    print(f"Orders Import Result: {od_res}")
    
    print("Importing payments.csv...")
    pd_res = import_csv(db, user.id, "payments", "payments.csv", payments_content)
    print(f"Payments Import Result: {pd_res}")
    
    print("Running reconciliation...")
    orders_data = db.query(Order).filter(Order.dataset_id == od_res["dataset_id"]).all()
    payments_data = db.query(Payment).filter(Payment.dataset_id == pd_res["dataset_id"]).all()
    
    reconcile(db, user.id, od_res["dataset_id"], pd_res["dataset_id"], orders_data, payments_data)
    
    # Analyze the latest run results
    from sqlalchemy import func
    
    print("\n--- RECONCILIATION SUMMARY ---")
    results = db.query(Result).filter(Result.orders_dataset_id == od_res["dataset_id"], Result.payments_dataset_id == pd_res["dataset_id"]).all()
    
    print(f"Total Results: {len(results)}")
    
    breakdown = {}
    total_risk = 0.0
    
    for r in results:
        total_risk += float(r.risk_amount)
        if r.classification not in breakdown:
            breakdown[r.classification] = {"count": 0, "amount": 0.0}
        breakdown[r.classification]["count"] += 1
        # Use difference if applicable, otherwise risk_amount? Let's use risk_amount.
        breakdown[r.classification]["amount"] += float(r.risk_amount)
        
    print(f"Total Risk Amount: ${total_risk:.2f}")
    print("\nBreakdown by Classification:")
    for cls, data in breakdown.items():
        print(f"  {cls}: {data['count']} items, ${data['amount']:.2f} risk")
        
    print("\nDone.")

if __name__ == "__main__":
    run()
