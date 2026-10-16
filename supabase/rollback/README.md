# Rollback scripts

Supabase migrations are forward-only. These scripts reverse each migration **destructively** and exist for
staging recovery. Apply in reverse order (005 → 001) with `psql "$DB_URL" -f <file>`, then remove the
corresponding rows from `supabase_migrations.schema_migrations`. Always take a backup and an export of member
data first. Locally, prefer `npx supabase db reset`. Verified locally: applying 005→001 then `db reset` restores
the full schema.
