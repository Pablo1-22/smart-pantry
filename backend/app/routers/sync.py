from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductResponse
from app.routers.deps import get_current_user
from app.models.pantry import PantryMember

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.get("/pull", response_model=list[ProductResponse])
async def pull_changes(
    since: Optional[datetime] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pull all product changes since a given timestamp for all user's pantries."""
    pantry_ids_result = await db.execute(
        select(PantryMember.pantry_id).where(PantryMember.user_id == user.id)
    )
    pantry_ids = [row[0] for row in pantry_ids_result.all()]

    if not pantry_ids:
        return []

    query = select(Product).where(Product.pantry_id.in_(pantry_ids))
    if since:
        query = query.where(Product.updated_at > since)
    query = query.order_by(Product.updated_at)

    result = await db.execute(query)
    return result.scalars().all()
