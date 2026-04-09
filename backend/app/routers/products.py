import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.routers.deps import verify_pantry_access

router = APIRouter(prefix="/api/pantries/{pantry_id}/products", tags=["products"])


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.pantry_id == pantry_id)
    if category:
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    query = query.order_by(Product.name)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    product = Product(pantry_id=pantry_id, **data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    logger.info("Dodano produkt '{}' do spiżarni {}", product.name, pantry_id)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.pantry_id == pantry_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.pantry_id == pantry_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.pantry_id == pantry_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    logger.info("Usunięto produkt '{}' ({}) ze spiżarni {}", product.name, product_id, pantry_id)
    await db.delete(product)
