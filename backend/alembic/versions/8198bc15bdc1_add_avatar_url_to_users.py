"""add avatar_url to users

Revision ID: 8198bc15bdc1
Revises: f9cb513b5d76
Create Date: 2025-08-28 22:05:33.224878+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8198bc15bdc1'
down_revision: Union[str, None] = 'f9cb513b5d76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))

def downgrade():
    op.drop_column("users", "avatar_url")
