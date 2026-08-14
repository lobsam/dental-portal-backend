# Dental Portal Backend

REST API for the dental portal, built with **FastAPI**, **SQLAlchemy (async)**, **Alembic**, and **PostgreSQL**, managed by **Poetry**.

## Requirements

- Python 3.11+
- PostgreSQL 14+
- [Poetry](https://python-poetry.org/)

## Getting Started

### 1. Install dependencies

```bash
poetry install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your PostgreSQL credentials:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dental_portal
```

### 3. Run database migrations

```bash
poetry run alembic upgrade head
```



### 4. Start the development server

```bash
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`



## Project Structure

```
dental-portal-backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Pydantic settings (reads .env)
│   │   └── database.py      # Async SQLAlchemy engine & session
│   ├── models/
│   │   └── base.py          # DeclarativeBase + TimestampMixin
│   └── api/
│       └── v1/
│           └── router.py    # API v1 routes
├── alembic/
│   ├── env.py               # Alembic async migration environment
│   └── versions/            # Auto-generated migration files
├── alembic.ini
├── pyproject.toml
└── .env.example
```



## Common Commands


| Task              | Command                                                       |
| ----------------- | ------------------------------------------------------------- |
| Install deps      | `poetry install`                                              |
| Run server        | `poetry run uvicorn app.main:app --reload`                    |
| Create migration  | `poetry run alembic revision --autogenerate -m "description"` |
| Apply migrations  | `poetry run alembic upgrade head`                             |
| Rollback one step | `poetry run alembic downgrade -1`                             |
| Lint              | `poetry run ruff check .`                                     |
| Format            | `poetry run ruff format .`                                    |
| Run tests         | `poetry run pytest`                                           |




## Adding a New Model

1. Create your model file in `app/models/` inheriting from `Base` (and optionally `TimestampMixin`):

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
```

1. Import it in `app/models/__init__.py` so Alembic picks it up:

```python
from app.models.patient import Patient  # noqa: F401
```

1. Generate and apply the migration:

```bash
poetry run alembic revision --autogenerate -m "add patients table"
poetry run alembic upgrade head
```

