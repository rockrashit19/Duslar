"""init (empty)

Revision ID: 3e0114b63762
Revises: 8198bc15bdc1
Create Date: 2025-08-31 20:18:50.731903+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e0114b63762'
down_revision: Union[str, None] = '8198bc15bdc1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
