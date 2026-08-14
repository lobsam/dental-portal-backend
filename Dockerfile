FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

# System deps needed to build asyncpg/bcrypt wheels on slim images
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.8.3

COPY pyproject.toml poetry.lock ./

# Re-lock against this image's pinned Poetry version first -- the lock file
# committed to the repo may have been generated with a different Poetry
# version, which changes the content-hash and makes 1.8.3 reject it as
# stale even when dependencies haven't actually changed.
# Then install everything (pyproject uses PEP 621 + dependency-groups,
# which Poetry 1.8's --only main doesn't reliably target).
RUN poetry lock --no-update --no-ansi \
    && poetry install --no-root --no-ansi

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
