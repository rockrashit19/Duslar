"""users trust_score default 0

Revision ID: 970651f67d19
Revises: d9f96da38247
Create Date: 2025-08-18 14:05:42.574090+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '970651f67d19'
down_revision: Union[str, None] = 'd9f96da38247'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET trust_score = 0 WHERE trust_score IS NULL")
    op.alter_column("users", "trust_score", server_default=sa.text("0"))


def downgrade() -> None:
    op.alter_column("users", "trust_score", server_default=None)
