"""Diagnostic script: prints the actual enum values Postgres currently has.

Run with: poetry run python check_enums.py
Delete this file once you're done diagnosing.
"""
import asyncio

from sqlalchemy import text

from app.core.database import engine


async def main():
    async with engine.connect() as conn:
        for type_name in [
            "appointment_status",
            "appointment_request_status",
            "user_role",
        ]:
            result = await conn.execute(
                text(
                    "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid "
                    "WHERE t.typname = :tn ORDER BY e.enumsortorder"
                ),
                {"tn": type_name},
            )
            print(type_name, "->", [r[0] for r in result])


asyncio.run(main())
