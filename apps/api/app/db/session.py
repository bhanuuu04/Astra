from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool

from app.core.config import get_settings

db_url = get_settings().database_url or "sqlite:///./astra_dev.db"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
else:
    connect_args = {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
    engine = create_engine(
        db_url,
        poolclass=QueuePool,
        pool_size=3,
        max_overflow=2,
        pool_timeout=15,
        pool_recycle=180,
        pool_pre_ping=True,
        connect_args=connect_args,
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
