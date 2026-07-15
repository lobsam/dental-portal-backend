from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[User]:
        result = await self.db.execute(select(User).where(User.clinic_id == clinic_id))
        return list(result.scalars().all())

    async def get(self, clinic_id: int, user_id: int) -> User:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.clinic_id == clinic_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return user

    async def create(self, clinic_id: int, data: UserCreate) -> User:
        existing = await self.db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

        payload = data.model_dump(exclude={"password"})
        user = User(clinic_id=clinic_id, hashed_password=hash_password(data.password), **payload)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, clinic_id: int, user_id: int, data: UserUpdate) -> User:
        user = await self.get(clinic_id, user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user
