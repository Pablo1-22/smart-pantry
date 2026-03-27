import uuid
from datetime import datetime

from pydantic import BaseModel


class ShoppingListItemCreate(BaseModel):
    product_name: str
    quantity: float = 1.0


class ShoppingListItemUpdate(BaseModel):
    is_bought: bool


class ShoppingListItemResponse(BaseModel):
    id: uuid.UUID
    pantry_id: uuid.UUID
    product_name: str
    quantity: float
    is_bought: bool
    created_at: datetime

    model_config = {"from_attributes": True}
