import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.pantry import MemberRole


class PantryCreate(BaseModel):
    name: str


class PantryUpdate(BaseModel):
    name: str


class PantryResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PantryMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    role: MemberRole
    joined_at: datetime

    model_config = {"from_attributes": True}


class PantryInvite(BaseModel):
    email: str
