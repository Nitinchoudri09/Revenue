import sys
from pathlib import Path

# Ensure the backend directory (parent of alembic/) is on sys.path
# so that `from app.core import ...` resolves correctly.
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from alembic import context
from sqlalchemy import engine_from_config, pool
from app.core import settings
from app.models import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)


def offline():
    context.configure(
        url=settings.database_url,
        target_metadata=Base.metadata,
        literal_binds=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


offline() if context.is_offline_mode() else online()
