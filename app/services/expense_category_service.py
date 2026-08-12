from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense_category import ExpenseCategory
from app.schemas.expense_category import ExpenseCategoryCreate, ExpenseCategoryUpdate


class ExpenseCategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[ExpenseCategory]:
        result = await self.db.execute(
            select(ExpenseCategory)
            .where(ExpenseCategory.clinic_id == clinic_id)
            .order_by(ExpenseCategory.name)
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, category_id: int) -> ExpenseCategory:
        result = await self.db.execute(
            select(ExpenseCategory).where(
                ExpenseCategory.id == category_id, ExpenseCategory.clinic_id == clinic_id
            )
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense category not found")
        return category

    async def create(self, clinic_id: int, data: ExpenseCategoryCreate) -> ExpenseCategory:
        category = ExpenseCategory(clinic_id=clinic_id, **data.model_dump())
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def update(
        self, clinic_id: int, category_id: int, data: ExpenseCategoryUpdate
    ) -> ExpenseCategory:
        category = await self.get(clinic_id, category_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete(self, clinic_id: int, category_id: int) -> None:
        category = await self.get(clinic_id, category_id)
        category.is_active = False
        await self.db.commit()
