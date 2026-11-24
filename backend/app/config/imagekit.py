from imagekitio import AsyncImageKit

from app.config.settings import get_settings

settings = get_settings()

imagekit = AsyncImageKit(
    private_key=settings.IMAGEKIT_PRIVATE_KEY
)