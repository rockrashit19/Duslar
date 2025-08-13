import os
import sqlalchemy as sa

url = os.getenv("DATABASE_URL")
engine = sa.create_engine(url, pool_pre_ping=True) # type: ignore

with engine.connect() as conn:
    one = conn.execute(sa.text("SELECT 1")).scalar_one()
    print("DB OK:", one)
