import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pantry import Pantry, PantryMember, MemberRole
from app.models.user import User
from app.schemas.pantry import (
    PantryCreate,
    PantryUpdate,
    PantryResponse,
    PantryMemberResponse,
    PantryInvite,
)
from app.routers.deps import get_current_user, verify_pantry_access

router = APIRouter(prefix="/api/pantries", tags=["pantries"])


@router.get("/", response_model=list[PantryResponse])
async def list_pantries(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pantry)
        .join(PantryMember, PantryMember.pantry_id == Pantry.id)
        .where(PantryMember.user_id == user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=PantryResponse, status_code=status.HTTP_201_CREATED)
async def create_pantry(
    data: PantryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pantry = Pantry(name=data.name, owner_id=user.id)
    db.add(pantry)
    await db.flush()

    member = PantryMember(pantry_id=pantry.id, user_id=user.id, role=MemberRole.OWNER)
    db.add(member)
    await db.flush()
    await db.refresh(pantry)
    return pantry


@router.get("/{pantry_id}", response_model=PantryResponse)
async def get_pantry(
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pantry).where(Pantry.id == pantry_id))
    return result.scalar_one()


@router.put("/{pantry_id}", response_model=PantryResponse)
async def update_pantry(
    data: PantryUpdate,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pantry).where(Pantry.id == pantry_id))
    pantry = result.scalar_one()
    pantry.name = data.name
    await db.flush()
    await db.refresh(pantry)
    return pantry


@router.delete("/{pantry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pantry(
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pantry).where(Pantry.id == pantry_id))
    pantry = result.scalar_one()
    if pantry.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can delete")
    await db.delete(pantry)


@router.get("/{pantry_id}/members", response_model=list[PantryMemberResponse])
async def list_members(
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PantryMember).where(PantryMember.pantry_id == pantry_id)
    )
    return result.scalars().all()


@router.post("/{pantry_id}/invite", response_model=PantryMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    data: PantryInvite,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    owner_check = await db.execute(
        select(PantryMember).where(
            PantryMember.pantry_id == pantry_id,
            PantryMember.user_id == user.id,
        )
    )
    caller = owner_check.scalar_one()
    if caller.role != MemberRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can invite members")

    result = await db.execute(select(User).where(User.email == data.email))
    invited_user = result.scalar_one_or_none()
    if not invited_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = await db.execute(
        select(PantryMember).where(
            PantryMember.pantry_id == pantry_id,
            PantryMember.user_id == invited_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already a member")

    member = PantryMember(pantry_id=pantry_id, user_id=invited_user.id, role=MemberRole.MEMBER)
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.delete("/{pantry_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    user_id: uuid.UUID,
    pantry_id: uuid.UUID = Depends(verify_pantry_access),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pantry).where(Pantry.id == pantry_id))
    pantry = result.scalar_one()
    if pantry.owner_id != user.id and user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    result = await db.execute(
        select(PantryMember).where(
            PantryMember.pantry_id == pantry_id,
            PantryMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    await db.delete(member)
