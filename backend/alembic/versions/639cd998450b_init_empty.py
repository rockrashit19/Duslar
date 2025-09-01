"""init (empty)

Revision ID: 639cd998450b
Revises: 586e706cc774
Create Date: 2025-08-12 15:56:48.241155+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '639cd998450b'
down_revision: Union[str, None] = '586e706cc774'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
