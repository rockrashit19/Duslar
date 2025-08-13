"""init (empty)

Revision ID: 586e706cc774
Revises: 933868bd3f04
Create Date: 2025-08-12 15:35:46.160172+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '586e706cc774'
down_revision: Union[str, None] = '933868bd3f04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
