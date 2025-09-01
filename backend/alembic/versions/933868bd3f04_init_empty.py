"""init (empty)

Revision ID: 933868bd3f04
Revises: 3fd978f360a3
Create Date: 2025-08-12 15:34:56.380042+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '933868bd3f04'
down_revision: Union[str, None] = '3fd978f360a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
