from app.services.d1 import D1Client, get_d1_client

_d1_client: D1Client | None = None


def get_db() -> D1Client:
    """FastAPI dependency — returns a shared D1Client instance."""
    global _d1_client
    if _d1_client is None:
        _d1_client = get_d1_client()
    return _d1_client
