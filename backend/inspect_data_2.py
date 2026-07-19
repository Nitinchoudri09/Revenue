import pandas as pd
import numpy as np

def inspect():
    orders = pd.read_csv('../orders.csv', dtype=str)
    payments = pd.read_csv('../payments.csv', dtype=str)
    
    print("\n=== MISMATCHES ACROSS FILES ===")
    merged = pd.merge(orders, payments, left_on='order_id', right_on='order_reference', how='inner', suffixes=('_o', '_p'))
    
    currency_mismatches = merged[merged['currency_o'] != merged['currency_p']]
    print(f"Currency Mismatches: {len(currency_mismatches)}")
    if len(currency_mismatches) > 0:
        for _, row in currency_mismatches.iterrows():
            print(f"  {row['order_id']}: Order {row['currency_o']}, Payment {row['currency_p']}")
            
    amount_mismatches = merged[merged['net_amount'] != merged['amount']]
    print(f"Amount Mismatches: {len(amount_mismatches)}")
    if len(amount_mismatches) > 0:
        for _, row in amount_mismatches.iterrows():
            o_amt = float(row['net_amount'])
            p_amt = float(row['amount'])
            print(f"  {row['order_id']}: Order {o_amt}, Payment {p_amt}, Delta {p_amt - o_amt:.2f}")

    print("\n=== OTHER ANOMALIES ===")
    with open('../orders.csv', 'rb') as f:
        print(f"Orders encoding hint: Starts with {f.read(3)}")
    with open('../payments.csv', 'rb') as f:
        print(f"Payments encoding hint: Starts with {f.read(3)}")

if __name__ == '__main__':
    inspect()
