# SQL Execution Rule (Required)

## Rule
All remote SQL must be executed from this repository using:

`scripts/apply-sql-migrations.ps1`

## Why
- Avoid drift between SQL Editor hotfixes and repository migrations.
- Guarantee reproducibility for `belapop` and `belapop-staging`.
- Keep an explicit execution ledger in each project (`public.codex_applied_sql_files`).

## Standard command
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-sql-migrations.ps1 -StartFrom 20260303_0100
```

## Emergency hotfix policy
- SQL Editor may be used only for emergency diagnosis/hotfix.
- Every manual SQL must be backported to `supabase/migrations/*.sql`.
- After backport, run the script again so both environments are aligned.

