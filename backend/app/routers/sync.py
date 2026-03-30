import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductResponse
from app.routers.deps import get_current_user
from app.models.pantry import PantryMember

router = APIRouter(prefix="/api/sync", tags=["sync"])


# ── schemas ────────────────────────────────────────────────────────────────────

class ActionType(str, Enum):
    create = "create"
    update = "update"
    delete = "delete"


class SyncAction(BaseModel):
    type: ActionType
    pantry_id: uuid.UUID
    id: Optional[uuid.UUID] = None       # product UUID (client-generated for creates)
    payload: Optional[dict] = None       # product fields
    timestamp: Optional[datetime] = None  # client-side action time


class SyncActionResult(BaseModel):
    index: int
    success: bool
    product: Optional[ProductResponse] = None
    error: Optional[str] = None


class SyncPushRequest(BaseModel):
    actions: list[SyncAction]


class SyncPushResponse(BaseModel):
    results: list[SyncActionResult]


# ── helpers ────────────────────────────────────────────────────────────────────

async def _user_pantry_ids(user: User, db: AsyncSession) -> set[uuid.UUID]:
    result = await db.execute(
        select(PantryMember.pantry_id).where(PantryMember.user_id == user.id)
    )
    return {row[0] for row in result.all()}


# ── endpoints ──────────────────────────────────────────────────────────────────

@router.get("/pull", response_model=list[ProductResponse])
async def pull_changes(
    since: Optional[datetime] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pull all product changes since a given timestamp for all user's pantries."""
    pantry_ids = await _user_pantry_ids(user, db)
    if not pantry_ids:
        return []

    query = select(Product).where(Product.pantry_id.in_(pantry_ids))
    if since:
        query = query.where(Product.updated_at > since)
    query = query.order_by(Product.updated_at)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/push", response_model=SyncPushResponse)
async def push_changes(
    body: SyncPushRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply a queue of offline actions (create / update / delete) in timestamp order."""
    allowed_pantries = await _user_pantry_ids(user, db)

    # Sort by timestamp so older actions apply first (last-write-wins by updated_at)
    sorted_actions = sorted(
        enumerate(body.actions),
        key=lambda x: x[1].timestamp or datetime.min.replace(tzinfo=timezone.utc),
    )

    results: list[SyncActionResult] = []

    for original_idx, action in sorted_actions:
        # Access control — skip actions for pantries the user doesn't belong to
        if action.pantry_id not in allowed_pantries:
            results.append(SyncActionResult(
                index=original_idx,
                success=False,
                error="No access to pantry",
            ))
            continue

        try:
            if action.type == ActionType.create:
                result = await _apply_create(action, db)
            elif action.type == ActionType.update:
                result = await _apply_update(action, db)
            else:
                result = await _apply_delete(action, db)
            results.append(SyncActionResult(index=original_idx, success=True, product=result))
        except Exception as exc:  # noqa: BLE001
            results.append(SyncActionResult(index=original_idx, success=False, error=str(exc)))

    await db.flush()
    results.sort(key=lambda r: r.index)
    return SyncPushResponse(results=results)


async def _apply_create(action: SyncAction, db: AsyncSession) -> Optional[ProductResponse]:
    """Create a product; if it already exists (idempotent retry), return the existing one."""
    if action.id:
        existing = await db.get(Product, action.id)
        if existing:
            return ProductResponse.model_validate(existing)

    payload = action.payload or {}
    product = Product(
        id=action.id or uuid.uuid4(),
        pantry_id=action.pantry_id,
        name=payload.get("name", ""),
        barcode=payload.get("barcode"),
        quantity=float(payload.get("quantity", 1.0)),
        unit=payload.get("unit", "szt"),
        category=payload.get("category"),
        expiry_date=payload.get("expiry_date"),
        min_quantity=float(payload.get("min_quantity", 0.0)),
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


async def _apply_update(action: SyncAction, db: AsyncSession) -> Optional[ProductResponse]:
    """Update a product; last-write-wins via updated_at."""
    if not action.id:
        raise ValueError("id required for update")

    product = await db.get(Product, action.id)
    if not product:
        return None  # product deleted elsewhere — skip silently

    payload = action.payload or {}
    action_ts = action.timestamp or datetime.now(timezone.utc)
    if action_ts.tzinfo is None:
        action_ts = action_ts.replace(tzinfo=timezone.utc)

    # Last-write-wins: only apply if action is newer than current updated_at
    product_ts = product.updated_at
    if product_ts.tzinfo is None:
        product_ts = product_ts.replace(tzinfo=timezone.utc)

    if action_ts < product_ts:
        return ProductResponse.model_validate(product)  # server version is newer, skip

    allowed_fields = {"name", "barcode", "quantity", "unit", "category", "expiry_date", "min_quantity"}
    for field, value in payload.items():
        if field in allowed_fields:
            setattr(product, field, value)

    product.updated_at = action_ts
    await db.flush()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


async def _apply_delete(action: SyncAction, db: AsyncSession) -> None:
    """Delete a product if it still exists."""
    if not action.id:
        raise ValueError("id required for delete")

    product = await db.get(Product, action.id)
    if product:
        await db.delete(product)
    return None
