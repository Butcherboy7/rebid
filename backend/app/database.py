import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "rebid.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"

# Enable sqlite timeout configuration to prevent "database is locked" under rapid 2s polling & bot insertions
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def migrate_sqlite_schema(db_engine):
    """Automatically adds any missing columns to existing SQLite tables."""
    try:
        with db_engine.connect() as conn:
            # Check users table columns
            cursor = conn.execute(text("PRAGMA table_info(users)"))
            existing_user_cols = {row[1] for row in cursor.fetchall()}
            
            user_columns_to_add = {
                "company_name": "TEXT",
                "rep_name": "TEXT",
                "rep_designation": "TEXT",
                "rep_phone": "TEXT",
                "rep_email": "TEXT",
                "gst_number": "TEXT",
                "pan_number": "TEXT",
                "cin": "TEXT",
                "org_type": "TEXT",
                "years_in_business": "INTEGER",
                "registered_address": "TEXT",
                "bank_account_name": "TEXT",
                "bank_name": "TEXT",
                "bank_account_number": "TEXT",
                "bank_ifsc": "TEXT",
                "bank_upi": "TEXT",
                "rejection_reason": "TEXT",
                "email_verified": "BOOLEAN DEFAULT 0",
                "email_verified_at": "DATETIME",
                "status": "TEXT DEFAULT 'pending_verification'"
            }
            
            for col_name, col_type in user_columns_to_add.items():
                if col_name not in existing_user_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception as e:
                        pass

            # Check vendors table columns
            cursor = conn.execute(text("PRAGMA table_info(vendors)"))
            existing_vendor_cols = {row[1] for row in cursor.fetchall()}
            
            vendor_columns_to_add = {
                "rep_name": "TEXT",
                "rep_designation": "TEXT",
                "rep_phone": "TEXT",
                "rep_email": "TEXT",
                "gst_number": "TEXT",
                "pan_number": "TEXT",
                "cin": "TEXT",
                "org_type": "TEXT",
                "years_in_business": "INTEGER",
                "registered_address": "TEXT",
                "bank_account_name": "TEXT",
                "bank_name": "TEXT",
                "bank_account_number": "TEXT",
                "bank_ifsc": "TEXT",
                "bank_upi": "TEXT",
                "certifications_json": "TEXT",
                "client_references_json": "TEXT",
                "previous_contracts_json": "TEXT",
                "product_categories_json": "TEXT",
                "manufacturing_capacity": "TEXT"
            }
            
            for col_name, col_type in vendor_columns_to_add.items():
                if col_name not in existing_vendor_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE vendors ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception as e:
                        pass
    except Exception as e:
        print(f"[Schema Migration Note] {e}")


# Run migration automatically
migrate_sqlite_schema(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
