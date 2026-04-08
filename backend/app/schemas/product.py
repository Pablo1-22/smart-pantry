import uuid
from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, field_validator


class ProductCreate(BaseModel):
    name: str
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    quantity: float = 1.0
    unit: str = "szt"
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    min_quantity: float = 0.0

    @field_validator("quantity", "min_quantity")
    @classmethod
    def must_be_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Wartość nie może być ujemna")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    min_quantity: Optional[float] = None

    @field_validator("quantity", "min_quantity")
    @classmethod
    def must_be_non_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Wartość nie może być ujemna")
        return v


class ProductResponse(BaseModel):
    id: uuid.UUID
    pantry_id: uuid.UUID
    name: str
    barcode: Optional[str]
    image_url: Optional[str]
    quantity: float
    unit: str
    category: Optional[str]
    expiry_date: Optional[date]
    min_quantity: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BarcodeResponse(BaseModel):
    barcode: str
    name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    found: bool
