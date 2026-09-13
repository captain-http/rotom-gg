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

# Conventions

- `get*` always returns a value (or throws). `find*` may return undefined — the name tells callers to handle "not there". `list*` returns an array, possibly empty.
- Modules of related pure functions are imported as a namespace (`import * as gameLog from "./game-log"`), so names stay short.
- Every exported function in `lib/domain/` has a JSDoc comment.
- Players in examples, tests, and fixtures are **Red** (the viewer, who exported the log) and **Blue** (the opponent); test Clerk ids are `user_red` and `user_blue`. Replace real usernames in fixtures before committing — the repo is public.

- UI work follows the design language in `.claude/skills/rotom-design/SKILL.md`: read it before building or restyling anything in `app/`.

# Adding a game log fixture

Real logs live in `test/fixtures/logs/`, each `<name>.txt` next to `<name>.json`. `lib/domain/game-log.test.ts` runs every pair; there is nothing to register. See `win-bench-out-opponent-timeouts` for a complete example.

1. **Name it** by what makes the game distinct, in kebab-case: result first, then the notable cases — `loss-deck-out-went-first`.
2. **Find the viewer.** It's the player whose draws name the card (`X drew Lillie's Determination.`) — not whoever appears first or won the coin toss. The viewer becomes `Red`, the other player `Blue`.
3. **Replace both usernames everywhere**, as whole words, including possessives with a straight `'` or curly `’` apostrophe. Don't touch card names that contain `Red` or `Blue`. Afterwards, grep the file for both original names: zero matches.
4. **Change nothing else.** Keep whitespace, blank lines, `-` and `•` prefixes, and odd characters exactly as exported — they are what the parser has to handle.
5. **Write the `.json`**: one key per exported `gameLog` function, each set to what it should return for that log (`null` for undefined). Work the values out by reading the log — never by running the parser and copying its output. The test fails if a function is missing, so adding a function to `game-log.ts` means adding its key to every fixture.
6. If the test fails, the parser is wrong, not the fixture: fix `lib/domain/game-log.ts`.
