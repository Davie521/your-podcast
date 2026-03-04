import logging

from app.config import get_settings
from app.services.d1 import D1Client
from app.services.local_sqlite import LocalSQLiteClient

logger = logging.getLogger(__name__)

_db_client: D1Client | LocalSQLiteClient | None = None


def _has_d1_config() -> bool:
    s = get_settings()
    return bool(s.cloudflare_account_id and s.cloudflare_api_token and s.d1_database_id)


def create_db_client(settings=None) -> D1Client | LocalSQLiteClient:
    """Create a new DB client based on available configuration.

    Used by CLI scripts and background tasks that need their own client.
    """
    if _has_d1_config():
        from app.services.d1 import get_d1_client
        return get_d1_client(settings)
    return LocalSQLiteClient()


def get_db() -> D1Client | LocalSQLiteClient:
    """FastAPI dependency — returns D1Client in production, LocalSQLiteClient in local dev."""
    global _db_client
    if _db_client is None:
        _db_client = create_db_client()
        kind = "Cloudflare D1" if _has_d1_config() else "local SQLite"
        logger.info("Using %s database", kind)
    return _db_client
