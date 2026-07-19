import csv,io
from fastapi import FastAPI,Depends,File,HTTPException,UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from pydantic import BaseModel,EmailStr,Field
from sqlalchemy import func,select
from sqlalchemy.orm import Session
from app.core import get_db,passwords,settings,token,token_user
from app.models import Dataset,Explanation,Order,Payment,Result,User,ReconciliationRun
from app.services import explain,import_csv,reconcile
class Register(BaseModel): name:str=Field(min_length=2); email:EmailStr; password:str=Field(min_length=8,max_length=72)
class Login(BaseModel): email:EmailStr; password:str
class Run(BaseModel): orders_dataset_id:int; payments_dataset_id:int
class Explain(BaseModel): result_id:int
app=FastAPI(title="Revenue Reconciliation API")
frontend_origins=[origin.strip() for origin in settings.frontend_url.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://revenue-ec1w.onrender.com", "http://localhost:5173"] + frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer=HTTPBearer()
def user(c:HTTPAuthorizationCredentials=Depends(bearer),db:Session=Depends(get_db)):
    try: value=db.get(User,token_user(c.credentials))
    except ValueError: value=None
    if not value: raise HTTPException(401,"Invalid or expired token")
    return value
def owned(db,uid,did,kind): return db.scalar(select(Dataset).where(Dataset.id==did,Dataset.user_id==uid,Dataset.kind==kind))
from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
@app.post("/auth/register",status_code=201)
def register(body:Register,db:Session=Depends(get_db)):
    if db.scalar(select(User).where(User.email==body.email.lower())): raise HTTPException(409,"Email already registered")
    value=User(name=body.name,email=body.email.lower(),password_hash=passwords.hash(body.password));db.add(value);db.commit();db.refresh(value);return {"access_token":token(value.id),"token_type":"bearer"}
@app.post("/auth/login")
def login(body:Login,db:Session=Depends(get_db)):
    value=db.scalar(select(User).where(User.email==body.email.lower()))
    if not value or not passwords.verify(body.password,value.password_hash):raise HTTPException(401,"Invalid credentials")
    return {"access_token":token(value.id),"token_type":"bearer"}
async def upload(kind,file,u,db):
    data=await file.read(settings.max_upload_bytes+1)
    if len(data)>settings.max_upload_bytes:raise HTTPException(413,"File too large")
    return import_csv(db,u.id,kind,file.filename or kind+".csv",data)
@app.post("/upload/orders")
async def orders(file:UploadFile=File(...),u=Depends(user),db:Session=Depends(get_db)):return await upload("orders",file,u,db)
@app.post("/upload/payments")
async def payments(file:UploadFile=File(...),u=Depends(user),db:Session=Depends(get_db)):return await upload("payments",file,u,db)
@app.post("/reconciliation/run")
def run(body:Run,u=Depends(user),db:Session=Depends(get_db)):
    od=owned(db,u.id,body.orders_dataset_id,"orders");pd=owned(db,u.id,body.payments_dataset_id,"payments")
    if not od or not pd:raise HTTPException(404,"Dataset not found")
    return reconcile(db,u.id,od.id,pd.id,list(db.scalars(select(Order).where(Order.dataset_id==od.id))),list(db.scalars(select(Payment).where(Payment.dataset_id==pd.id))))
@app.get("/discrepancies")
def discrepancies(status:str|None=None,currency:str|None=None,search:str|None=None,skip:int=0,limit:int=50,u=Depends(user),db:Session=Depends(get_db)):
    from sqlalchemy import or_
    latest_run = db.scalar(select(ReconciliationRun).where(ReconciliationRun.user_id==u.id).order_by(ReconciliationRun.id.desc()))
    if not latest_run: return []
    q=select(Result).where(Result.run_id==latest_run.id)
    if status:q=q.where(Result.classification==status)
    if currency:q=q.where(Result.currency==currency.upper())
    if search:
        term=f"%{search.strip()}%"
        q=q.outerjoin(Order, Result.order_id==Order.id).outerjoin(Payment, Result.payment_id==Payment.id).where(
            or_(
                Result.match_key.ilike(term),
                Order.order_id.ilike(term),
                Order.order_reference.ilike(term),
                Payment.order_id.ilike(term),
                Payment.order_reference.ilike(term),
                Payment.payment_id.ilike(term),
                Result.classification.ilike(term),
                Result.reason.ilike(term),
            )
        )
    return list(db.scalars(q.order_by(Result.id.desc()).offset(max(skip,0)).limit(min(max(limit,1),200))))
@app.get("/discrepancy/{rid}")
def detail(rid:int,u=Depends(user),db:Session=Depends(get_db)):
    value=db.scalar(select(Result).where(Result.id==rid,Result.user_id==u.id))
    if not value:raise HTTPException(404,"Not found")
    return value
@app.get("/dashboard")
def dashboard(u=Depends(user),db:Session=Depends(get_db)):
    latest_run = db.scalar(select(ReconciliationRun).where(ReconciliationRun.user_id==u.id).order_by(ReconciliationRun.id.desc()))
    if not latest_run: return {"total_orders":0,"total_payments":0,"matched_orders":0,"matched_value":0,"money_at_risk":0,"disputed_value":0,"discrepancy_count":0,"reconciliation_percent":0,"breakdown":{}}
    rows=list(db.scalars(select(Result).where(Result.run_id==latest_run.id))); matched=[x for x in rows if x.classification=="matched"];breakdown={}
    for x in rows:breakdown[x.classification]=breakdown.get(x.classification,0)+1
    
    total_orders = db.scalar(select(func.count(Order.id)).where(Order.dataset_id==latest_run.orders_dataset_id)) or 0
    total_payments = db.scalar(select(func.count(Payment.id)).where(Payment.dataset_id==latest_run.payments_dataset_id)) or 0
    
    return {"total_orders":total_orders,"total_payments":total_payments,"matched_orders":len(matched),"matched_value":float(sum((x.expected_amount for x in matched),0)),"money_at_risk":float(sum((x.risk_amount for x in rows),0)),"disputed_value":float(sum((abs(x.difference) for x in rows if x.classification!="matched"),0)),"discrepancy_count":len(rows)-len(matched),"reconciliation_percent":round(100*len(matched)/len(rows),2) if rows else 0,"breakdown":breakdown}
@app.post("/llm/explain")
def llm(body:Explain,u=Depends(user),db:Session=Depends(get_db)):
    value=db.scalar(select(Result).where(Result.id==body.result_id,Result.user_id==u.id))
    if not value:raise HTTPException(404,"Not found")
    cached=db.scalar(select(Explanation).where(Explanation.result_id==value.id))
    if cached:return cached
    data=explain(value);db.add(Explanation(result_id=value.id,**data));db.commit();return data
@app.get("/dataset/{dataset_id}/errors")
def dataset_errors(dataset_id:int,u=Depends(user),db:Session=Depends(get_db)):
    from app.models import ImportError as ImportErrorModel
    dataset=owned(db,u.id,dataset_id,"orders") or owned(db,u.id,dataset_id,"payments")
    if not dataset:raise HTTPException(404,"Dataset not found")
    return list(db.scalars(select(ImportErrorModel).where(ImportErrorModel.dataset_id==dataset_id).order_by(ImportErrorModel.id)))

@app.get("/runs")
def runs(u=Depends(user),db:Session=Depends(get_db)):
    return list(db.scalars(select(ReconciliationRun).where(ReconciliationRun.user_id==u.id).order_by(ReconciliationRun.id.desc())))

@app.get("/export")
def export(u=Depends(user),db:Session=Depends(get_db)):
    latest_run = db.scalar(select(ReconciliationRun).where(ReconciliationRun.user_id==u.id).order_by(ReconciliationRun.id.desc()))
    out=io.StringIO();w=csv.writer(out);w.writerow(["key","classification","reason","expected","actual","difference","risk","currency"])
    if latest_run:
        for x in db.scalars(select(Result).where(Result.run_id==latest_run.id)):w.writerow([x.match_key,x.classification,x.reason,x.expected_amount,x.actual_amount,x.difference,x.risk_amount,x.currency])
    return StreamingResponse(iter([out.getvalue()]),media_type="text/csv",headers={"Content-Disposition":"attachment; filename=reconciliation.csv"})
