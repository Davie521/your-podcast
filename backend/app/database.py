import logging

from app.config import get_settings
from app.types import DatabaseClient

logger = logging.getLogger(__name__)

_db_client: DatabaseClient | None = None


def create_db_client(settings=None) -> DatabaseClient:
    """Create a new DB client based on DATABASE_BACKEND setting.

    Used by CLI scripts and background tasks that need their own client.
    """
    s = settings or get_settings()
    if s.database_backend == "d1":
        from app.services.d1 import get_d1_client
        return get_d1_client(s)
    from app.services.local_sqlite import LocalSQLiteClient
    return LocalSQLiteClient()


def get_db() -> DatabaseClient:
    """FastAPI dependency — returns D1Client or LocalSQLiteClient based on config."""
    global _db_client
    if _db_client is None:
        s = get_settings()
        _db_client = create_db_client(s)
        logger.info("Using %s database", s.database_backend)
    return _db_client
