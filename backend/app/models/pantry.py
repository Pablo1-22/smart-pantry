import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    MEMBER = "member"


class Pantry(Base):
    __tablename__ = "pantries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner = relationship("User", back_populates="owned_pantries")
    members = relationship("PantryMember", back_populates="pantry", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="pantry", cascade="all, delete-orphan")
    shopping_items = relationship(
        "ShoppingListItem", back_populates="pantry", cascade="all, delete-orphan"
    )


class PantryMember(Base):
    __tablename__ = "pantry_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pantry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pantries.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[MemberRole] = mapped_column(
        SAEnum(MemberRole), default=MemberRole.MEMBER, nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    pantry = relationship("Pantry", back_populates="members")
    user = relationship("User", back_populates="memberships")
