"""init (empty)

Revision ID: 82c213826006
Revises: ffa979f7616d
Create Date: 2025-08-12 18:30:55.034110

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '82c213826006'
down_revision: Union[str, None] = 'ffa979f7616d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
