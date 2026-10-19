<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git

- Never create branches worktress or commits automatically. only do so when the user explicitly asks for that specific actionin current request
- leave changes uncommitted in the working tree on the current branch and let the user decide when and how to commit

## Data & Schema

- This is a development project. There is **no backward compatibility** and data is worthless. Prefer data loss over effort.
- **Never** backfill, migrate, or preserve existing rows. **Never** spend effort keeping old data working.
- Every schema change means a clean slate — drop the old shape and start fresh.

## Database (Drizzle + Neon)

- Use **push only**: `bun run db:push` (`drizzle-kit push`). This project has no migration files and no migration history.
- **Never** run `drizzle-kit generate`, `drizzle-kit migrate`, or add a `db:generate` / `db:migrate` script. Never create a `drizzle/` migrations folder or a `drizzle` Postgres schema.
- Schema changes are destructive by nature: push diffs the live DB against `db/schema.ts` and drops what is no longer declared. Before pushing, confirm the schema change is intended.
- `drizzle.config.ts` uses `DATABASE_URL_UNPOOLED` (direct) on purpose — never point it at the pooled `DATABASE_URL`.
