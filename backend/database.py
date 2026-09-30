import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def ensure_complaint_columns():
    """Add new columns without dropping existing tables or data."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "complaints" not in table_names:
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("complaints")
    }

    if "citizen_mobile" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE complaints ADD COLUMN citizen_mobile VARCHAR(20)")
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
