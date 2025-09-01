"""init (empty)

Revision ID: f9cb513b5d76
Revises: 09c8f3f7e60a
Create Date: 2025-08-28 12:44:09.271704+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9cb513b5d76'
down_revision: Union[str, None] = '09c8f3f7e60a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
