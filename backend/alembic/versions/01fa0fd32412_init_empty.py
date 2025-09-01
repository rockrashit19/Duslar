"""init (empty)

Revision ID: 01fa0fd32412
Revises: 639cd998450b
Create Date: 2025-08-12 15:57:59.497065+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01fa0fd32412'
down_revision: Union[str, None] = '639cd998450b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
