from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
from pydantic_settings import BaseSettings,SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
class Settings(BaseSettings):
    database_url:str="sqlite:///./reconcile.db"; jwt_secret:str="development-secret-change-me-32-characters"; openai_api_key:str=""; openai_model:str="gpt-4.1-mini"; frontend_url:str="http://localhost:5173"; jwt_minutes:int=60; max_upload_bytes:int=10_000_000
    model_config=SettingsConfigDict(env_file=".env",extra="ignore")
settings=Settings(); engine=create_engine(settings.database_url,connect_args={"check_same_thread":False} if settings.database_url.startswith("sqlite") else {},pool_pre_ping=True); SessionLocal=sessionmaker(bind=engine,expire_on_commit=False); passwords=CryptContext(schemes=["bcrypt"],deprecated="auto")
def get_db():
    db=SessionLocal()
    try: yield db
    finally: db.close()
def token(uid:int): return jwt.encode({"sub":str(uid),"exp":datetime.now(timezone.utc)+timedelta(minutes=settings.jwt_minutes)},settings.jwt_secret,algorithm="HS256")
def token_user(value:str):
    try: return int(jwt.decode(value,settings.jwt_secret,algorithms=["HS256"])["sub"])
    except (JWTError,KeyError,ValueError) as exc: raise ValueError from exc
