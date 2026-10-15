from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_database_schema(db_engine):
    """
    Safely inspects existing tables and ensures newly added model columns
    exist without destroying data.
    """
    from sqlalchemy import inspect, text
    inspector = inspect(db_engine)
    table_names = inspector.get_table_names()

    with db_engine.connect() as conn:
        if "invoices" in table_names:
            inv_cols = {c["name"] for c in inspector.get_columns("invoices")}
            if "has_discrepancy" not in inv_cols:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN has_discrepancy BOOLEAN DEFAULT 0"))
            if "discrepancy_count" not in inv_cols:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN discrepancy_count INTEGER DEFAULT 0"))
            if "discrepancy_notes" not in inv_cols:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN discrepancy_notes TEXT DEFAULT '[]'"))

        if "documents" in table_names:
            doc_cols = {c["name"] for c in inspector.get_columns("documents")}
            if "has_discrepancy" not in doc_cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN has_discrepancy BOOLEAN DEFAULT 0"))
            if "discrepancy_notes" not in doc_cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN discrepancy_notes TEXT DEFAULT '[]'"))

        conn.commit()

