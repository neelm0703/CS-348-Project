FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-install-project

COPY . .

RUN uv sync --frozen

ENV PATH="/app/.venv/bin:$PATH"

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
