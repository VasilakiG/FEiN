from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = "postgresql://vasilaki:adminpassword@db:5432/fein1"

# Create the database engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

try:
    with engine.connect() as connection:
        print("Database connection successful")
except Exception as e:
    print(f"Failed to connect to the database: {e}")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
