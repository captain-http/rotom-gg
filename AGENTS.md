<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Workflow

- Commit and push to `main` without asking, in small steps. No feature branches or PRs.
- `bin/verify` must pass before every commit.
- Pushing to `main` deploys to production, including migrations.
- Ask before a migration that drops, renames, or rewrites existing data — a revert can't undo it.
- Never force-push or rewrite history.
- Never add `minimumReleaseAgeExclude` entries. If pnpm rejects a version as too new, pin the newest one it accepts.
