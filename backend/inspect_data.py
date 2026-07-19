import pandas as pd
import numpy as np

def inspect():
    orders = pd.read_csv('../orders.csv', dtype=str)
    payments = pd.read_csv('../payments.csv', dtype=str)
    
    print("=== ROW COUNTS ===")
    print(f"Orders: {len(orders)} rows")
    print(f"Payments: {len(payments)} rows")
    
    print("\n=== COLUMN HEADERS ===")
    print(f"Orders: {list(orders.columns)}")
    print(f"Payments: {list(payments.columns)}")
    
    print("\n=== DATA TYPES & FORMATS ===")
    print("Orders Date Sample:")
    print(orders['order_date'].head(3).tolist())
    print("Payments Date Sample:")
    print(payments['processed_at'].head(3).tolist())
    
    print("\n=== DUPLICATES ===")
    print(f"Orders with duplicate order_id: {orders.duplicated(subset=['order_id']).sum()}")
    if orders.duplicated(subset=['order_id']).sum() > 0:
        print(orders[orders.duplicated(subset=['order_id'], keep=False)]['order_id'].tolist())
        
    print(f"Payments with duplicate transaction_ref: {payments.duplicated(subset=['transaction_ref']).sum()}")
    
    print("\n=== MISSING MATCHES ===")
    o_ids = set(orders['order_id'].dropna().str.strip().str.lower())
    p_refs = set(payments['order_reference'].dropna().str.strip().str.lower())
    
    print(f"Order IDs in orders but not payments: {len(o_ids - p_refs)}")
    print(f"Order IDs in payments but not orders: {len(p_refs - o_ids)}")
    
    print("\n=== NULLS/BLANKS IN REQUIRED FIELDS ===")
    print("Orders missing order_id:", orders['order_id'].isna().sum())
    print("Orders missing amount:", orders['net_amount'].isna().sum())
    print("Orders missing currency:", orders['currency'].isna().sum())
    
    print("Payments missing order_reference:", payments['order_reference'].isna().sum())
    print("Payments missing amount:", payments['amount'].isna().sum())
    print("Payments missing currency:", payments['currency'].isna().sum())
    
    print("\n=== DISTINCT STATUS VALUES ===")
    print(f"Orders status values: {orders['status'].unique().tolist()}")
    print(f"Payments status values: {payments['status'].unique().tolist()}")

if __name__ == '__main__':
    inspect()
