import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.email import send_password_reset_email
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.clinic import Clinic
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

# Generic response for forgot-password so the API doesn't reveal whether an
# email address is registered (prevents user enumeration).
_FORGOT_PASSWORD_MESSAGE = (
    "If an account with that email exists, a password reset link has been sent."
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> TokenResponse:
        existing = await self.db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

        clinic = Clinic(
            name=data.clinic_name,
            contact_number=data.contact_number,
            country=data.country,
        )
        self.db.add(clinic)
        await self.db.flush()  # populate clinic.id

        owner = User(
            clinic_id=clinic.id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            hashed_password=hash_password(data.password),
            role=UserRole.OWNER,
        )
        self.db.add(owner)
        await self.db.commit()
        await self.db.refresh(owner)

        return self._issue_tokens(owner)

    async def login(self, data: LoginRequest) -> TokenResponse:
        result = await self.db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        if user is None or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")

        return self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

        user = await self.db.get(User, int(payload["sub"]))
        if user is None or not user.is_active:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

        return self._issue_tokens(user)

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
        user.hashed_password = hash_password(new_password)
        await self.db.commit()

    # --- Forgot / reset password --------------------------------------------

    async def forgot_password(self, email: str) -> str:
        """Issue a reset token and email it, if the address is registered.

        Always returns the same generic message regardless of whether the
        account exists, so callers can't use this endpoint to enumerate
        registered emails.
        """
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is not None and user.is_active:
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(
                minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
            )

            self.db.add(
                PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
            )
            await self.db.commit()

            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
            await send_password_reset_email(user.email, user.first_name, reset_url)

        return _FORGOT_PASSWORD_MESSAGE

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        result = await self.db.execute(
            select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        )
        reset_token = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)
        expires_at = reset_token.expires_at if reset_token else None
        if expires_at is not None and expires_at.tzinfo is None:
            # Some drivers (e.g. SQLite, used in tests) don't round-trip
            # timezone-aware datetimes; treat naive values as UTC.
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if (
            reset_token is None
            or reset_token.used_at is not None
            or expires_at < now
        ):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")

        user = await self.db.get(User, reset_token.user_id)
        if user is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")

        user.hashed_password = hash_password(new_password)
        reset_token.used_at = now
        await self.db.commit()

    def _issue_tokens(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id, user.clinic_id, user.role.value),
            refresh_token=create_refresh_token(user.id),
        )
