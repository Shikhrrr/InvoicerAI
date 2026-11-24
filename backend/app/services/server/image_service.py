import httpx
import hashlib

from app.config.settings import get_settings


class ImageService:

    def __init__(self):
        self.settings = get_settings()

    async def retrieve_image(
        self,
        image_url: str,
    ) -> tuple[bytes, str, str]:

        async with httpx.AsyncClient(
            timeout=30,
            follow_redirects=True,
        ) as client:

            response = await client.get(image_url)
            response.raise_for_status()

        image_bytes = response.content

        if len(image_bytes) > self.settings.MAX_UPLOAD_SIZE:
            raise ValueError("Image exceeds maximum allowed size")

        mime_type = (
            response.headers
            .get("content-type", "")
            .split(";")[0]
            .lower()
        )

        if mime_type not in self.settings.ALLOWED_IMAGE_TYPES:
            raise ValueError("Unsupported image format")

        image_hash = hashlib.sha256(image_bytes).hexdigest()

        return image_bytes, mime_type, image_hash