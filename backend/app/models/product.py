import uuid
from datetime import datetime, date, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Date, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pantry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pantries.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="szt", nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    min_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    pantry = relationship("Pantry", back_populates="products")
