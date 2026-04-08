import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.shopping_list import ShoppingListItem


async def generate_shopping_list(pantry_id: uuid.UUID, db: AsyncSession) -> list[ShoppingListItem]:
    """Generate shopping list items for products below min_quantity."""
    result = await db.execute(
        select(Product).where(
            Product.pantry_id == pantry_id,
            Product.min_quantity > 0,
            Product.quantity <= Product.min_quantity,
        )
    )
    low_products = result.scalars().all()

    items = []
    for product in low_products:
        needed = max(product.min_quantity - product.quantity, 1)
        item = ShoppingListItem(
            pantry_id=pantry_id,
            product_name=product.name,
            quantity=needed,
            unit=product.unit,
            category=product.category,
            source_product_id=product.id,
        )
        db.add(item)
        items.append(item)

    await db.flush()
    for item in items:
        await db.refresh(item)
    return items
