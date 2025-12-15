"""
S3/MinIO storage module для загрузки и получения файлов.
"""
import io
import uuid
from typing import BinaryIO, Optional
from datetime import timedelta

import boto3
from botocore.exceptions import ClientError
from botocore.client import Config

from app.config import settings


class StorageClient:
    """Клиент для работы с S3-совместимым хранилищем (MinIO/S3)."""

    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name=settings.S3_REGION,
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Создать бакет, если не существует (для MinIO/S3, не для R2)."""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            # Для Cloudflare R2 бакеты создаются через Dashboard, пропускаем автосоздание
            if "r2.cloudflarestorage.com" in settings.S3_ENDPOINT_URL:
                print(f"R2 bucket {self.bucket_name} should be created via Cloudflare Dashboard")
                return
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                print(f"Ошибка создания бакета {self.bucket_name}: {e}")

    def upload_file(
        self,
        file_data: BinaryIO,
        content_type: str = "image/png",
        prefix: str = "results",
        filename: Optional[str] = None,
    ) -> str:
        """
        Загрузить файл в S3.
        
        Args:
            file_data: бинарные данные файла
            content_type: MIME тип
            prefix: префикс пути (например, 'inputs', 'results')
            filename: имя файла (если None, генерируется UUID)
        
        Returns:
            object_key (путь в бакете)
        """
        if filename is None:
            ext = content_type.split("/")[-1]
            filename = f"{uuid.uuid4()}.{ext}"

        object_key = f"{prefix}/{filename}"

        try:
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                object_key,
                ExtraArgs={"ContentType": content_type},
            )
            return object_key
        except ClientError as e:
            raise RuntimeError(f"Ошибка загрузки файла в S3: {e}")

    def upload_bytes(
        self,
        data: bytes,
        content_type: str = "image/png",
        prefix: str = "results",
        filename: Optional[str] = None,
    ) -> str:
        """Загрузить bytes в S3."""
        file_obj = io.BytesIO(data)
        return self.upload_file(file_obj, content_type, prefix, filename)

    def get_presigned_url(self, object_key: str, expiration: int = 3600) -> str:
        """
        Генерировать временную ссылку для скачивания.
        
        Args:
            object_key: путь к файлу в бакете
            expiration: время жизни ссылки (сек)
        
        Returns:
            presigned URL
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": object_key},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            raise RuntimeError(f"Ошибка генерации presigned URL: {e}")

    def delete_file(self, object_key: str):
        """Удалить файл из S3."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_key)
        except ClientError as e:
            print(f"Ошибка удаления файла {object_key}: {e}")


# Singleton instance
storage = StorageClient()

