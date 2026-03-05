FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev --extra generate

COPY . /app
RUN uv sync --frozen --no-dev --extra generate

ENV PATH="/app/.venv/bin:$PATH"

CMD ["sh", "-c", "echo 'Starting app...' && mkdir -p data && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
