"""TEAS Token Economy, Tier-1 Centre Store, Idempotent Sync & Memo0 Registry Schema

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "token_balances",
        sa.Column("student_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_spent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        schema="education",
    )

    op.create_table(
        "token_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("tx_type", sa.String(length=32), nullable=False),
        sa.Column("reference_id", sa.String(length=255), nullable=False, unique=True),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        schema="education",
    )

    op.create_table(
        "store_items",
        sa.Column("item_id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cost_coins", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        schema="education",
    )

    op.create_table(
        "redemptions",
        sa.Column("redemption_id", sa.String(length=64), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("item_id", sa.String(length=64), sa.ForeignKey("education.store_items.item_id"), nullable=False),
        sa.Column("cost_coins", sa.Integer(), nullable=False),
        sa.Column("verifier_name", sa.String(length=128), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        schema="education",
    )

    op.create_table(
        "quiz_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("chapter_id", sa.String(length=128), nullable=False),
        sa.Column("question_id", sa.String(length=128), nullable=False),
        sa.Column("selected_option", sa.String(length=64), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("hints_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("points_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answered_at", sa.String(length=64), nullable=False),
        sa.UniqueConstraint("student_id", "question_id", "answered_at", name="uq_quiz_results_idempotent"),
        schema="education",
    )


def downgrade() -> None:
    op.drop_table("quiz_results", schema="education")
    op.drop_table("redemptions", schema="education")
    op.drop_table("store_items", schema="education")
    op.drop_table("token_transactions", schema="education")
    op.drop_table("token_balances", schema="education")
