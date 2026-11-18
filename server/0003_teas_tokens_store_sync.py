"""Phase 2 Migration 0003: TEAS Tokens, Store Items, Redemptions & Offline Quiz Sync

Revision ID: 0003_teas_tokens_store_sync
Revises: 0002_initial_core_tables
Create Date: 2026-10-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_teas_tokens_store_sync"
down_revision = "0002_initial_core_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "token_balances",
        sa.Column("student_id", sa.String(length=64), primary_key=True),
        sa.Column("balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lifetime_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "token_transactions",
        sa.Column("tx_id", sa.String(length=64), primary_key=True),
        sa.Column("student_id", sa.String(length=64), nullable=False, index=True),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=128), nullable=False),
        sa.Column("chapter_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "store_items",
        sa.Column("item_id", sa.String(length=64), primary_key=True),
        sa.Column("title_en", sa.String(length=128), nullable=False),
        sa.Column("title_hi", sa.String(length=128), nullable=False),
        sa.Column("cost_coins", sa.Integer(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("stock_qty", sa.Integer(), nullable=False, server_default="100"),
    )
    op.create_table(
        "redemptions",
        sa.Column("redemption_id", sa.String(length=64), primary_key=True),
        sa.Column("student_id", sa.String(length=64), nullable=False, index=True),
        sa.Column("item_id", sa.String(length=64), nullable=False),
        sa.Column("cost_coins", sa.Integer(), nullable=False),
        sa.Column("staff_pin_verified", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "quiz_results",
        sa.Column("attempt_id", sa.String(length=128), primary_key=True),
        sa.Column("student_id", sa.String(length=64), nullable=False, index=True),
        sa.Column("chapter_id", sa.String(length=128), nullable=False, index=True),
        sa.Column("score_pct", sa.Integer(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("coins_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("quiz_results")
    op.drop_table("redemptions")
    op.drop_table("store_items")
    op.drop_table("token_transactions")
    op.drop_table("token_balances")
