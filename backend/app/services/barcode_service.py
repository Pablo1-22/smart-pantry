import httpx

from app.config import get_settings
from app.schemas.product import BarcodeResponse

settings = get_settings()


async def lookup_barcode(code: str) -> BarcodeResponse:
    url = f"{settings.OPEN_FOOD_FACTS_URL}/{code}.json"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)

    if resp.status_code != 200:
        return BarcodeResponse(barcode=code, found=False)

    data = resp.json()
    if data.get("status") != 1:
        return BarcodeResponse(barcode=code, found=False)

    product = data.get("product", {})
    return BarcodeResponse(
        barcode=code,
        name=product.get("product_name"),
        category=product.get("categories", "").split(",")[0].strip() or None,
        image_url=product.get("image_url"),
        found=True,
    )
