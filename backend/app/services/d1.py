"""Thin async client for Cloudflare D1 REST API."""

import logging

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

D1_API_BASE = "https://api.cloudflare.com/client/v4/accounts"


class D1Client:
    """Wraps the Cloudflare D1 HTTP query API."""

    def __init__(self, account_id: str, api_token: str, database_id: str) -> None:
        self._url = f"{D1_API_BASE}/{account_id}/d1/database/{database_id}/query"
        self._headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }

    async def execute(
        self, sql: str, params: list | None = None
    ) -> list[dict]:
        """Execute a single SQL statement and return result rows as dicts."""
        body: dict = {"sql": sql}
        if params:
            body["params"] = params

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self._url, json=body, headers=self._headers, timeout=30.0
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            raise RuntimeError(f"D1 query failed: {errors}")

        results = data.get("result", [])
        if not results:
            return []
        return results[0].get("results", [])

    async def batch(self, statements: list[dict]) -> list[list[dict]]:
        """Execute multiple SQL statements in a single batch request.

        Each statement is a dict with 'sql' and optional 'params' keys.
        Returns a list of result-row lists, one per statement.
        """
        async with httpx.AsyncClient() as client:
            # D1 batch: POST body is a JSON array of statements
            resp = await client.post(
                self._url,
                json=statements,
                headers=self._headers,
                timeout=60.0,
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            raise RuntimeError(f"D1 batch failed: {errors}")

        all_results = []
        for result in data.get("result", []):
            all_results.append(result.get("results", []))
        return all_results


def get_d1_client(settings: Settings | None = None) -> D1Client:
    """Factory — create a D1Client from app settings."""
    if settings is None:
        settings = get_settings()
    return D1Client(
        account_id=settings.cloudflare_account_id,
        api_token=settings.cloudflare_api_token,
        database_id=settings.d1_database_id,
    )
