"""init (empty)

Revision ID: 3fd978f360a3
Revises: 82c213826006
Create Date: 2025-08-12 15:31:07.412487+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fd978f360a3'
down_revision: Union[str, None] = '82c213826006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
