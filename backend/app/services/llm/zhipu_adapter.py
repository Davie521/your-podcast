"""ZhiPu AI adapter — wraps zhipuai SDK (open.bigmodel.cn)."""

from zhipuai import ZhipuAI

_MODEL = "glm-5"


class ZhipuClient:
    def __init__(self, api_key: str) -> None:
        self._client = ZhipuAI(api_key=api_key)

    def chat(self, prompt: str) -> str:
        response = self._client.chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
