import os
from abc import ABC, abstractmethod
from typing import Optional
import aiofiles
from app.core.config import settings

class StorageProvider(ABC):
    @abstractmethod
    async def upload(self, file_bytes: bytes, destination_key: str, mime_type: str) -> str:
        """Store bytes and return storage key."""
        pass

    @abstractmethod
    async def get(self, storage_key: str) -> bytes:
        """Retrieve file bytes."""
        pass

    @abstractmethod
    async def delete(self, storage_key: str) -> bool:
        """Delete file from storage."""
        pass

    @abstractmethod
    async def exists(self, storage_key: str) -> bool:
        """Check if file exists."""
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = base_path or settings.STORAGE_LOCAL_PATH
        os.makedirs(self.base_path, exist_ok=True)

    def _get_full_path(self, storage_key: str) -> str:
        # Strip potential traversal characters
        clean_key = storage_key.lstrip("/\\").replace("..", "")
        return os.path.join(self.base_path, clean_key)

    async def upload(self, file_bytes: bytes, destination_key: str, mime_type: str) -> str:
        full_path = self._get_full_path(destination_key)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(file_bytes)
        return destination_key

    async def get(self, storage_key: str) -> bytes:
        full_path = self._get_full_path(storage_key)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Storage key {storage_key} not found")
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete(self, storage_key: str) -> bool:
        full_path = self._get_full_path(storage_key)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False

    async def exists(self, storage_key: str) -> bool:
        full_path = self._get_full_path(storage_key)
        return os.path.exists(full_path)

def get_storage_provider() -> StorageProvider:
    # Pluggable factory per PRD Rule 8
    if settings.STORAGE_PROVIDER == "local":
        return LocalStorageProvider()
    return LocalStorageProvider()
