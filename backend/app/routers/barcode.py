from fastapi import APIRouter, Depends

from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.product import BarcodeResponse
from app.services.barcode_service import lookup_barcode

router = APIRouter(prefix="/api/barcode", tags=["barcode"])


@router.get("/{code}", response_model=BarcodeResponse)
async def get_barcode_info(code: str, _user: User = Depends(get_current_user)):
    return await lookup_barcode(code)
