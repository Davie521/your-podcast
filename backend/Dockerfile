FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# 先复制依赖文件，安装依赖（利用 Docker 层缓存）
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# 复制代码并安装项目
COPY . /app
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH"

# Railway 注入 PORT 环境变量，shell form 让 $PORT 展开
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
