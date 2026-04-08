import uuid
from datetime import datetime

from pydantic import BaseModel


class ShoppingListItemCreate(BaseModel):
    product_name: str
    quantity: float = 1.0
    unit: str = "szt"
    category: str | None = None
    source_product_id: uuid.UUID | None = None


class ShoppingListItemUpdate(BaseModel):
    is_bought: bool | None = None
    quantity: float | None = None


class ShoppingListItemResponse(BaseModel):
    id: uuid.UUID
    pantry_id: uuid.UUID
    product_name: str
    quantity: float
    unit: str
    category: str | None
    is_bought: bool
    source_product_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
