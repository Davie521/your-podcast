FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY . /app
RUN uv sync --frozen --no-dev


FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:$PATH"

COPY --from=builder /app /app

EXPOSE 8000
CMD ["sh", "-c", "echo 'Starting app...' && mkdir -p data && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
