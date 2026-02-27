import base64
import hashlib
import os

from cryptography.fernet import Fernet

from app.config import settings


def _fernet_key() -> bytes:
    if settings.TOKEN_ENCRYPTION_KEY:
        return settings.TOKEN_ENCRYPTION_KEY.encode("utf-8")

    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def get_fernet() -> Fernet:
    return Fernet(_fernet_key())


def encrypt_secret(value: str) -> str:
    return get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str) -> str:
    return get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")
