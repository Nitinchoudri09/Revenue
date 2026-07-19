from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = (UniqueConstraint("user_id", "kind", "content_hash", name="uq_dataset_content"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    filename: Mapped[str] = mapped_column(String(255))
    content_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    order_id: Mapped[str|None] = mapped_column(String(120))
    order_reference: Mapped[str|None] = mapped_column(String(120))
    normalized_order_id: Mapped[str|None] = mapped_column(String(120), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3))
    status: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime|None] = mapped_column(DateTime(timezone=True))

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    payment_id: Mapped[str|None] = mapped_column(String(120))
    order_id: Mapped[str|None] = mapped_column(String(120))
    order_reference: Mapped[str|None] = mapped_column(String(120))
    normalized_order_reference: Mapped[str|None] = mapped_column(String(120), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    fee: Mapped[Decimal] = mapped_column(Numeric(14, 2), server_default="0.00", default=Decimal("0.00"))
    settled_amount: Mapped[Decimal|None] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3))
    status: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime|None] = mapped_column(DateTime(timezone=True))

class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    orders_dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    payments_dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Result(Base):
    __tablename__ = "reconciliation_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[int|None] = mapped_column(ForeignKey("reconciliation_runs.id", ondelete="CASCADE"), index=True)
    orders_dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"))
    payments_dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"))
    order_id: Mapped[int|None] = mapped_column(ForeignKey("orders.id"))
    payment_id: Mapped[int|None] = mapped_column(ForeignKey("payments.id"))
    match_key: Mapped[str] = mapped_column(String(120))
    classification: Mapped[str] = mapped_column(String(40), index=True)
    reason: Mapped[str] = mapped_column(Text)
    expected_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    actual_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    difference: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    risk_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str|None] = mapped_column(String(3))
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    order: Mapped[Order|None] = relationship()
    payment: Mapped[Payment|None] = relationship()

class Explanation(Base):
    __tablename__ = "llm_explanations"
    id: Mapped[int] = mapped_column(primary_key=True)
    result_id: Mapped[int] = mapped_column(ForeignKey("reconciliation_results.id", ondelete="CASCADE"), unique=True)
    summary: Mapped[str] = mapped_column(Text)
    likely_cause: Mapped[str] = mapped_column(Text)
    business_impact: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ImportError(Base):
    __tablename__ = "import_errors"
    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"), index=True)
    row_index: Mapped[int] = mapped_column()
    error_message: Mapped[str] = mapped_column(Text)
    raw_data: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
