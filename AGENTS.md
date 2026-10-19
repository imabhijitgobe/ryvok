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

## Forms

One stack, always: `react-hook-form` + `zodResolver` + a `drizzle-zod` schema
derived from `db/schema.ts`. Never hand-roll validation in the client.

- **Derive the schema from the table.** Use `createInsertSchema` in
  `db/schema.ts` and refine it there. Omit every column the client must not
  send (`id`, `userId`, `sandboxId`, `createdAt`, anything derived). The action
  and the form share that one schema — never define a second zod schema for the
  client.
- **Prefer `insertBotSchema`'s shape for new tables:** omit server-derived
  columns, refine lengths and emptiness with real messages
  (`.min(1, "Give your bot a name.")`), and re-declare optional text fields in
  `.extend()` so a control that submits `""` still validates.
- **The action re-parses.** A server action is a public endpoint. `safeParse`
  the input server side, resolve the user id from Clerk `auth()`, and never
  trust a client-supplied `userId`, `orgId`, role, or price.
- **Actions return a result, they do not throw at the user.** Return
  `{ status: "error", errors }` (use a `_root` key for non-field errors) or
  `{ status: "success", ... }`. Throw or redirect only for control flow.
- **Return what the UI needs.** If the client shows a confirmation naming the
  new record, return that field — do not hardcode a generic string and expect
  the client to know better.
- **`"use client"` on the form component**, `"use server"` on the action file.
  `db/schema.ts` itself stays isomorphic so both can import it.
- **Field layout is `FieldGroup` + `Field`**, never a raw `div` with
  `space-y-*`/`grid gap-*`. Two-part rows (an avatar or icon plus text plus an
  action button) use `Field orientation="horizontal"` with
  `FieldContent` + `FieldTitle` + `FieldDescription`.
- **Validation needs both attributes.** `data-invalid` on the `Field` (styles
  label and description), `aria-invalid` on the control (styles the control).
  Render messages with `FieldError errors={[formState.errors.field]}`.
- **Quick-fill presets are `Button`**, not a `ToggleGroup` — a preset writes
  into fields (`setValue(..., { shouldDirty: true, shouldValidate: true })`)
  rather than being a value of its own. Reserve `ToggleGroup` for a real
  2–7 option selection.
- **Base UI, not Radix.** Triggers use `render={<Button .../>}`, never
  `asChild`, and never wrap a trigger in an extra element.
- **The trigger owns its button.** Put the `DialogTrigger` in the form
  component so `app/page.tsx` stays a thin routing layer and just renders
  `<BotDialog />`.
- **Feedback uses Base UI's toast** — `toast.add({ title, description })` from
  `@/components/ui/toast`. This project has no `sonner`.
- **Submit buttons** use `disabled={isPending}` from `useTransition`. `Button`
  has no `isPending`/`isLoading` prop.
- **Only `className` for outer layout.** A `sm:max-w-*` on `DialogContent` to
  size the dialog is fine; overriding colors, borders, or typography is not.

## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    bun install @dicebear/collection             ->  bun install @dicebear/styles
    bun install @dicebear/lorelei                ->  bun install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.
