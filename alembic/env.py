from logging.config import fileConfig
import os
import sys
import pathlib
from sqlalchemy import engine_from_config, pool
from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db.base import Base
from app.models import *

target_metadata = Base.metadata


def _get_db_url() -> str:
    # приоритет: -x DATABASE_URL=... > ENV > alembic.ini
    xargs = context.get_x_argument(as_dictionary=True)
    return xargs.get("DATABASE_URL") \
        or os.getenv("DATABASE_URL") \
        or config.get_main_option("sqlalchemy.url") # type: ignore


def run_migrations_offline() -> None:
    url = _get_db_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_server_default=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = _get_db_url()
    # подставим URL в конфиг перед созданием engine
    config.set_main_option("sqlalchemy.url", url)

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
