import asyncio
import json
import logging

import google.generativeai as genai

from app.services.rss import Article

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-1.5-flash"
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
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(_MODEL_NAME)

    articles_json = json.dumps(
        [{"index": i, "title": a["title"], "summary": a["summary"]} for i, a in enumerate(articles)],
        ensure_ascii=False,
    )
    interests_str = ", ".join(interests) if interests else "科技, 互联网"

    prompt = (
        "你是一个科技播客编辑。下面是今天抓取到的文章列表（JSON），以及用户感兴趣的领域。\n"
        f"用户兴趣: {interests_str}\n"
        f"文章列表:\n{articles_json}\n\n"
        f"请从中挑选最多 {_MAX_ARTICLES} 篇与用户兴趣最相关、最值得讨论的文章。\n"
        "只返回一个 JSON 数组，包含你选中文章的 index 数字，例如 [0, 3, 5]。\n"
        "不要输出任何其他文字。"
    )

    response = model.generate_content(prompt)
    text = response.text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3].strip()

    indices = json.loads(text)
    return [articles[i] for i in indices if 0 <= i < len(articles)]
