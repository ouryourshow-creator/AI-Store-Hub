#!/bin/bash
set -e

pnpm install

# Ensure the admin-editable settings table (used for the Binance EGP/USD
# exchange rate, and any future key/value config) exists on the dev
# database on every merge — without a code deploy or human step.
#
# We apply this one table directly with idempotent DDL instead of the
# general `drizzle-kit push`/`push-force` flow: several pre-existing tables
# have unique constraints that push's diff planner doesn't recognize as
# already satisfied, so it stops on an interactive truncate-table prompt
# with no TTY available here (see .agents/memory/drizzle-schema-gotchas.md).
# That's a separate, pre-existing issue unrelated to this table.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
SQL
