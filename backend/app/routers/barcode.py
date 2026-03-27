from fastapi import APIRouter

from app.schemas.product import BarcodeResponse
from app.services.barcode_service import lookup_barcode

router = APIRouter(prefix="/api/barcode", tags=["barcode"])


@router.get("/{code}", response_model=BarcodeResponse)
async def get_barcode_info(code: str):
    return await lookup_barcode(code)
