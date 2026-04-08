import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.models.shopping_list import ShoppingListItem
from app.schemas.shopping_list import (
    ShoppingListItemCreate,
    ShoppingListItemUpdate,
    ShoppingListItemResponse,
)
from app.services.product_service import generate_shopping_list
from app.routers.deps import verify_pantry_access

router = APIRouter(prefix="/api/pantries/{pantry_id}/shopping-list", tags=["shopping-list"])


@router.get("/", response_model=list[ShoppingListItemResponse])
async def list_items(
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShoppingListItem)
        .where(ShoppingListItem.pantry_id == pantry_id)
        .order_by(ShoppingListItem.is_bought, ShoppingListItem.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ShoppingListItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ShoppingListItemCreate,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    item = ShoppingListItem(pantry_id=pantry_id, **data.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.post("/generate", response_model=list[ShoppingListItemResponse])
async def generate_list(
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    items = await generate_shopping_list(pantry_id, db)
    return items


@router.put("/{item_id}", response_model=ShoppingListItemResponse)
async def update_item(
    item_id: uuid.UUID,
    data: ShoppingListItemUpdate,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShoppingListItem).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.pantry_id == pantry_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if data.quantity is not None:
        item.quantity = data.quantity

    # Mark as bought — sync with pantry
    if data.is_bought is not None:
        was_bought = item.is_bought
        item.is_bought = data.is_bought

        if data.is_bought and not was_bought:
            if item.source_product_id:
                # Existing product — add quantity
                prod = await db.get(Product, item.source_product_id)
                if prod:
                    prod.quantity += item.quantity
            else:
                # New product — create in pantry
                prod = Product(
                    pantry_id=pantry_id,
                    name=item.product_name,
                    quantity=item.quantity,
                    unit=item.unit,
                    category=item.category,
                    min_quantity=0,
                )
                db.add(prod)

    await db.flush()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShoppingListItem).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.pantry_id == pantry_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    await db.delete(item)
