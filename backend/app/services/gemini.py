import asyncio
import json
import logging

from google import genai

from app.services.rss import Article

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-2.5-flash"
_MAX_ARTICLES = 8


async def filter_articles(
    articles: list[Article], interests: list[str], api_key: str
) -> list[Article]:
    """Use Gemini to pick the most relevant articles for the user's interests."""
    if not articles:
        return []
    if not api_key:
        logger.warning("No Gemini API key provided, returning first %d articles", _MAX_ARTICLES)
        return articles[:_MAX_ARTICLES]

    try:
        return await asyncio.to_thread(_call_gemini, articles, interests, api_key)
    except Exception:
        logger.exception("Gemini filtering failed, falling back to first %d articles", _MAX_ARTICLES)
        return articles[:_MAX_ARTICLES]


def _call_gemini(
    articles: list[Article], interests: list[str], api_key: str
) -> list[Article]:
    client = genai.Client(api_key=api_key)

    articles_json = json.dumps(
        [{"index": i, "title": a["title"], "summary": a["summary"]} for i, a in enumerate(articles)],
        ensure_ascii=False,
    )
    interests_str = ", ".join(interests) if interests else "technology, internet"

    prompt = (
        "You are a tech podcast editor. Below is a list of articles (JSON) fetched today and the user's interests.\n"
        f"User interests: {interests_str}\n"
        f"Articles:\n{articles_json}\n\n"
        f"Pick up to {_MAX_ARTICLES} articles that are most relevant to the user's interests and worth discussing.\n"
        "Return ONLY a JSON array of the selected article index numbers, e.g. [0, 3, 5].\n"
        "Do not output any other text."
    )

    response = client.models.generate_content(model=_MODEL_NAME, contents=prompt)
    text = response.text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3].strip()

    indices = json.loads(text)
    return [articles[i] for i in indices if 0 <= i < len(articles)]
