from app.schemas.auth import LoginResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, UserResponse
from app.config.security import (
    create_access_token,
    hash_password,
    verify_password,
)

from datetime import datetime, timedelta, timezone

from app.config.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

from app.config.settings import get_settings
from app.repositories.refresh_session_repository import (
    RefreshSessionRepository,
)

class AuthService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repository = UserRepository(db)

    async def register(self,data: RegisterRequest) -> UserResponse:

        existing_user = await self.user_repository.get_by_email(
            data.email
        )

        if existing_user:
            raise ValueError("Email already registered")

        password_hash = hash_password(data.password)

        user = await self.user_repository.create(
            username=data.username,
            email=data.email,
            password_hash=password_hash,
        )

        await self.db.commit()

        return UserResponse.model_validate(user)

    async def login(
        self,
        email: str,
        password: str,
    ) -> LoginResult:

        user = await self.user_repository.get_by_email(email)

        if not user:
            raise ValueError("Invalid email or password")

        if not verify_password(
            password,
            user.password_hash,
        ):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("User account is inactive")

        settings = get_settings()

        access_token = create_access_token(
            str(user.id)
        )

        refresh_token = create_refresh_token()

        refresh_token_hash = hash_refresh_token(
            refresh_token
        )

        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        )

        refresh_repository = RefreshSessionRepository(
            self.db
        )

        await refresh_repository.create(
            user_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=expires_at,
        )

        await self.db.commit()

        return LoginResult(
            access_token=access_token,
            refresh_token=refresh_token,
        )


    async def refresh(
        self,
        refresh_token: str,
    ) -> LoginResult:

        settings = get_settings()

        refresh_repository = RefreshSessionRepository(
            self.db
        )

        token_hash = hash_refresh_token(
            refresh_token
        )

        session = await refresh_repository.get_by_token_hash(
            token_hash
        )

        if not session:
            raise ValueError("Invalid refresh token")

        now = datetime.now(timezone.utc)

        if session.revoked_at is not None:
            raise ValueError("Invalid refresh token")

        if session.expires_at <= now:
            raise ValueError("Refresh token expired")

        user = await self.user_repository.get_by_id(
            session.user_id
        )

        if not user:
            raise ValueError("Invalid refresh token")

        if not user.is_active:
            raise ValueError("User account is inactive")

        # Revoke old refresh session.
        await refresh_repository.revoke(session)

        # Create new refresh token.
        new_refresh_token = create_refresh_token()

        new_refresh_token_hash = hash_refresh_token(
            new_refresh_token
        )

        new_expires_at = (
            now
            + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        )

        await refresh_repository.create(
            user_id=user.id,
            token_hash=new_refresh_token_hash,
            expires_at=new_expires_at,
        )

        # Create new access token.
        new_access_token = create_access_token(
            str(user.id)
        )

        await self.db.commit()

        return LoginResult(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
        )


    async def logout(
        self,
        refresh_token: str | None,
    ) -> None:

        if not refresh_token:
            return

        refresh_repository = RefreshSessionRepository(
            self.db
        )

        token_hash = hash_refresh_token(
            refresh_token
        )

        await refresh_repository.revoke_by_token_hash(
            token_hash
        )

        await self.db.commit()