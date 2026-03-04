from app.services.d1 import D1Client, get_d1_client


def get_db() -> D1Client:
    """FastAPI dependency — returns a D1Client instance."""
    return get_d1_client()
