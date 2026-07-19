import hashlib,io,json
from collections import defaultdict
from decimal import Decimal,InvalidOperation
import pandas as pd
from fastapi import HTTPException
from openai import OpenAI
from sqlalchemy.exc import IntegrityError
import re
from app.core import settings
from app.models import Dataset,Order,Payment,Result, ImportError as ImportErrorModel
ZERO=Decimal("0.00")

def normalize_id(val):
    if not val: return None
    return re.sub(r'[^a-z0-9\-]', '', str(val).strip().lower())

def import_csv(db,uid,kind,name,content):
    try: frame=pd.read_csv(io.BytesIO(content),dtype=str).fillna(""); frame.columns=[c.strip().lower() for c in frame.columns]
    except Exception as exc: raise HTTPException(400,"Unreadable CSV") from exc
    if "amount" not in frame.columns:
        for alias in ["net_amount", "gross_amount", "value"]:
            if alias in frame.columns:
                frame.rename(columns={alias: "amount"}, inplace=True)
                break
    if "payment_id" not in frame.columns:
        for alias in ["transaction_ref", "transaction_id", "payment_reference"]:
            if alias in frame.columns:
                frame.rename(columns={alias: "payment_id"}, inplace=True)
                break
    if "created_at" not in frame.columns:
        for alias in ["processed_at", "order_date", "timestamp", "date"]:
            if alias in frame.columns:
                frame.rename(columns={alias: "created_at"}, inplace=True)
                break
    if "settled_amount" not in frame.columns:
        for alias in ["net_settled", "settled_value"]:
            if alias in frame.columns:
                frame.rename(columns={alias: "settled_amount"}, inplace=True)
                break
    if not {"amount","currency"}<=set(frame) or not ({"order_id","order_reference"}&set(frame)): raise HTTPException(422,"Required: amount, currency, and an order identifier")
    from sqlalchemy import select, func
    content_hash = hashlib.sha256(content).hexdigest()
    existing = db.scalar(select(Dataset).where(Dataset.user_id==uid, Dataset.kind==kind, Dataset.content_hash==content_hash))
    if existing:
        rows_count = db.scalar(select(func.count(Order.id if kind=="orders" else Payment.id)).where((Order.dataset_id if kind=="orders" else Payment.dataset_id)==existing.id))
        errors_count = db.scalar(select(func.count(ImportErrorModel.id)).where(ImportErrorModel.dataset_id==existing.id))
        return {"dataset_id":existing.id,"rows":rows_count,"errors":errors_count,"filename":existing.filename}
    
    ds=Dataset(user_id=uid,kind=kind,filename=name[:255],content_hash=content_hash); db.add(ds)
    try: db.flush()
    except IntegrityError as exc: db.rollback(); raise HTTPException(409,"Duplicate upload") from exc
    values=[]
    errors=[]
    for i,row in frame.iterrows():
        try:
            oid=row.get("order_id","").strip() or None; ref=row.get("order_reference","").strip() or None
            if not (oid or ref): raise ValueError(f"Row {i+2}: missing identifier")
            try: amount=Decimal(row.amount).quantize(Decimal(".01")); settled=Decimal(row.get("settled_amount")).quantize(Decimal(".01")) if row.get("settled_amount") else None
            except InvalidOperation: raise ValueError(f"Row {i+2}: invalid amount")
            currency=row.currency.strip().upper()
            if len(currency)!=3 or not currency.isalpha(): raise ValueError(f"Row {i+2}: invalid currency")
            date=pd.to_datetime(row.get("created_at"),utc=True,errors="coerce") if row.get("created_at") else None
            
            norm_id = normalize_id(oid)
            norm_ref = normalize_id(ref)
            base=dict(dataset_id=ds.id,order_id=oid,order_reference=ref,amount=amount,currency=currency,status=(row.get("status") or ("completed" if kind=="orders" else "succeeded")).lower(),created_at=date.to_pydatetime() if date is not None and not pd.isna(date) else None)
            
            if kind=="payments":
                try: fee = Decimal(row.get("fee", "0.00")).quantize(Decimal(".01"))
                except InvalidOperation: raise ValueError(f"Row {i+2}: invalid fee")
                values.append(Payment(**base,payment_id=row.get("payment_id") or None,settled_amount=settled, fee=fee, normalized_order_reference=norm_ref or norm_id))
            else:
                values.append(Order(**base, normalized_order_id=norm_id or norm_ref))
        except ValueError as exc:
            errors.append(ImportErrorModel(dataset_id=ds.id, row_index=i+2, error_message=str(exc), raw_data=json.dumps(row.to_dict())))
    if values: db.add_all(values)
    if errors: db.add_all(errors)
    db.commit(); return {"dataset_id":ds.id,"rows":len(values),"errors":len(errors),"filename":ds.filename}
def reconcile(db,uid,od,pd,orders,payments):
    from app.models import ReconciliationRun
    run = ReconciliationRun(user_id=uid, orders_dataset_id=od, payments_dataset_id=pd)
    db.add(run)
    db.commit()
    db.refresh(run)

    go=defaultdict(list); gp=defaultdict(list)
    for x in orders: go[x.normalized_order_id].append(x) if x.normalized_order_id else None
    for x in payments: gp[x.normalized_order_reference].append(x) if x.normalized_order_reference else None
    
    # Optional: Delete old results if needed, though this will now track by run_id
    # db.query(Result).filter_by(user_id=uid,orders_dataset_id=od,payments_dataset_id=pd).delete(); 
    
    results=[]
    for key in sorted(set(go)|set(gp)):
        os,ps=go.get(key, []),gp.get(key, [])
        o=os[0] if os else None; p=ps[0] if ps else None
        
        # Adjust expected logic, fee is included in settled calculation logic? 
        # Actually expected is sum of orders, actual is sum of payments.
        expected=sum((x.amount for x in os),ZERO)
        actual=sum((x.amount for x in ps),ZERO)
        if len(os)>1: c,r="duplicate_order","Multiple order rows share this identifier"
        elif len(ps)>1: c,r=("duplicate_payment" if len({x.payment_id for x in ps})<len(ps) else "multiple_payments"),"Multiple payments share this identifier"
        elif not os: c,r="payment_without_order","Payment has no order"
        elif not ps: c,r="missing_payment","Order has no payment"
        elif o.status in {"cancelled","canceled"}: c,r="cancelled_order","Payment relates to a cancelled order"
        elif o.status=="refunded": c,r="refunded_order","Order is marked refunded"
        elif p.status in {"failed","declined","voided"}: c,r="failed_payment","Payment did not succeed"
        elif o.currency!=p.currency: c,r="currency_mismatch","Currencies differ"
        elif p.settled_amount is not None and p.settled_amount!=(p.amount - p.fee): c,r="settlement_mismatch","Settled amount does not match amount minus fee"
        elif expected!=actual: c,r="amount_mismatch","Expected and actual amounts differ"
        elif o.status not in {"completed","paid","fulfilled"} or p.status not in {"succeeded","paid","completed","settled"}: c,r="status_mismatch","Statuses are not a completed pair"
        else: c,r="matched","Order and payment agree"
        
        diff=actual-expected
        risk=ZERO if c=="matched" else abs(diff) or max(expected,actual)
        
        results.append(Result(user_id=uid, run_id=run.id, orders_dataset_id=od,payments_dataset_id=pd,order_id=o.id if o else None,payment_id=p.id if p else None,match_key=key,classification=c,reason=r,expected_amount=expected,actual_amount=actual,difference=diff,risk_amount=risk,currency=o.currency if o else p.currency,confidence=Decimal("1")))
    
    db.add_all(results); db.commit(); return results
def explain(result):
    fallback={"summary":f"{result.classification.replace('_',' ').title()} for {result.match_key}.","likely_cause":result.reason,"business_impact":f"Potential exposure is {result.risk_amount} {result.currency or ''}.","recommended_action":"Review and correct or document the source records.","priority":"high" if result.risk_amount else "low"}
    if not settings.openai_api_key:return fallback
    prompt=json.dumps({"classification":result.classification,"reason":result.reason,"expected":str(result.expected_amount),"actual":str(result.actual_amount),"risk":str(result.risk_amount)})
    for _ in range(2):
        try:
            text=OpenAI(api_key=settings.openai_api_key).responses.create(model=settings.openai_model,temperature=.2,input="Return JSON with summary, likely_cause, business_impact, recommended_action, priority. Explain this deterministic result: "+prompt).output_text; value=json.loads(text)
            if set(fallback)<=set(value) and all(isinstance(value[k],str) for k in fallback): return value
        except Exception: pass
    return fallback
