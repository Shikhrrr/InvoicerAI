import hashlib
import uuid
from uuid import UUID
from io import BytesIO

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.config.imagekit import imagekit
from app.config.settings import get_settings


class UploadService:
    def __init__(self):
        self.settings = get_settings()

    async def validate_image(self, file: UploadFile) -> bytes:
        content = await file.read()

        if not content:
            raise ValueError("Empty file")

        if len(content) > self.settings.MAX_UPLOAD_SIZE:
            raise ValueError("File size exceeds 10 MB")

        try:
            image = Image.open(BytesIO(content))
            image.verify()
        except (UnidentifiedImageError, OSError):
            raise ValueError("Invalid image file")

        image_type = Image.open(BytesIO(content)).format

        allowed_formats = {
            "JPEG": "image/jpeg",
            "PNG": "image/png",
            "WEBP": "image/webp",
        }

        if allowed_formats.get(image_type) not in self.settings.ALLOWED_IMAGE_TYPES:
            raise ValueError("Unsupported image format")

        return content

    async def check_duplicate_image(
        self,
        user_id: UUID,
        image_hash: str,
    ):
        return await self.invoice_repository.find_by_image_hash(
            user_id=user_id,
            image_hash=image_hash,
        )

    async def upload_image(
        self,
        content: bytes,
        user_id: str,
    ) -> dict:

        extension = {
            "JPEG": "jpg",
            "PNG": "png",
            "WEBP": "webp",
        }[Image.open(BytesIO(content)).format]

        filename = f"{uuid.uuid4()}.{extension}"

        result = await imagekit.files.upload(
            file=content,
            file_name=filename,
            folder=f"/invoices/{user_id}",
        )

        return {
            "file_id": result.file_id,
            "url": result.url,
            "file_name": filename,
        }