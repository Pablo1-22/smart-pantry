import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pantry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pantries.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    is_bought: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    pantry = relationship("Pantry", back_populates="shopping_items")
