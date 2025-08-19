"""user notes

Revision ID: 61c9426449fe
Revises: 970651f67d19
Create Date: 2025-08-18 14:30:25.948713+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61c9426449fe'
down_revision: Union[str, None] = '970651f67d19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_notes',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('owner_id', sa.BigInteger(), nullable=False),
        sa.Column('target_user_id', sa.BigInteger(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_id', 'target_user_id', name='ux_user_note_pair'),
    )

def downgrade() -> None:
    op.drop_table('user_notes')

