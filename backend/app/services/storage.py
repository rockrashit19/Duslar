import os, uuid, mimetypes
from typing import BinaryIO
from datetime import datetime
from app.core.config import settings

class Storage:
    def save(self, stream: BinaryIO, filename: str, content_type: str | None) -> str: ...
    def build_key(self, filename: str) -> str:
        ext = os.path.splitext(filename or "")[1].lower() or ".bin"
        today = datetime.utcnow().strftime("%Y/%m/%d")
        return f"events/{today}/{uuid.uuid4().hex}{ext}"
        
class LocalStorage(Storage):
    def __init__(self, base_dir: str, public_base: str | None = None):
        self.base_dir = base_dir
        self.public_base = public_base
        
    def save(self, stream: BinaryIO, filename: str, content_type: str | None) -> str:
        os.makedirs(self.base_dir, exist_ok=True)
        key = self.build_key(filename)
        path = os.path.join(self.base_dir, key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as out:
            while True:
                chunk = stream.read(1024 * 1024)
                if not chunk: break
                out.write(chunk)
        if self.public_base:
            return f"{self.public_base.rstrip('/')}/{key}"
        return f"/media/{key}"
    
class S3Storage(Storage):
    def __init__(self):
        import boto3
        self.s3 = boto3.client(
            "s3",
            region_name=settings.s3_region,
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
        )
        self.bucket = settings.s3_bucket
        self.public_base = settings.s3_public_base_url
        
    def save(self, stream: BinaryIO, filename: str, content_type: str | None) -> str:
        key = self.build_key(filename)
        ct = content_type or (mimetypes.guess_type(filename)[0] or "application/octet-stream")
        try:
            try:
                stream.seek(0)
            except Exception:
                pass

            self.s3.upload_fileobj(
                Fileobj=stream,
                Bucket=self.bucket,
                Key=key,
                ExtraArgs={
                    "ContentType": ct,
                    "ACL": "public-read",
                    "CacheControl": "public, max-age=31536000, immutable",
                },
            )
        except Exception as e:
            raise
        if self.public_base:
            return f"{self.public_base.rstrip('/')}/{key}"
        base = settings.s3_endpoint_url.rstrip("/") if settings.s3_endpoint_url else f"https://{self.bucket}.s3.{settings.s3_region}.amazonaws.com"
        return f"{base}/{key}"

def get_storage() -> Storage:
    if settings.storage_backend == "s3":
        return S3Storage()
    public = settings.backend_base_url.rstrip("/") + "/media" if settings.backend_base_url else None
    return LocalStorage(settings.media_dir, public_base=public)
