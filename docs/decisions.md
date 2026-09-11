# Decisions

The stack for rotom.gg. These are decided, not preferences. Introducing an
alternative to anything here is a change to this file first.

## Rendering

Server Components by default. `"use client"` is an exception that needs a
reason. Data visualization is the one standing exception.

Why: the app is a form, a list, and some aggregates. Client state is the thing
that would make it complicated, so it stays out unless a component genuinely
cannot work without it.

## Data flow

Reads: Server Components call lib/domain/ and render the result. No SQL in app/.

Writes: Server Actions. Validate input with zod, resolve the current user,
then delegate to lib/domain/. Actions contain no business rules — only the
translation from request to typed arguments.

Domain: lib/domain/ holds all logic as plain functions. It imports nothing
from next/*. It takes and returns plain objects, never FormData or searchParams.

State: filters and sorting live in the URL. There is no client data cache.

Why: there is no client/server boundary to bridge, so there is nothing for an
RPC or query layer to solve. Server Actions are public HTTP endpoints — the UI
is not a boundary, so validation and scoping happen in the action. Keeping
lib/domain/ framework-free is what makes the logic testable as plain functions
and lets other callers — a background job, a script, a test — use the same
functions later without touching them. URL state also means the browser back
button works correctly, which matters most on a phone.

## Query layer

Drizzle.

Why: it hasn't gotten in the way, and the stats queries (streaks, win rate by
matchup) are window functions and conditional aggregates that it expresses with
real typed column references. Migrations are plain SQL you review before they run.

## Infrastructure

Deploy: Vercel.

Database: Postgres, hosted on Neon via the Vercel marketplace. The host is a
convenience, not a commitment.

Local and test databases run in Docker via compose. bin/setup brings them up
and applies migrations.

Why: keeping the push-to-deploy loop is worth more than ops control on a
project this size. Serverless has no persistent disk, so SQLite is out — and
Postgres means a second user needs no migration, with window functions
first-class for the stats queries.

## Background work

No queue. Work happens in the request.

after() is available for fire-and-forget side effects that can be lost without
consequence — logging, cache warming. It runs in the same invocation after the
response, so it has no durability, no retries, and no schedule.

Add a real queue when work must not be lost, or must happen with no user
present. Scheduled work is Vercel Cron, not a queue.

Why: parsing a log is milliseconds. Because lib/domain/ is framework-free, any
of these are thin callers of the same functions rather than a rewrite.

## Auth

Clerk. Session reading happens in app/ only; lib/domain/ takes userId as an
argument and never reads the session itself.

Every table has a user_id. Every query is scoped to it.

Why: keeping session access out of lib/domain/ is what lets the same functions
be called from a script, a job, or a test with no request context.

## Validation

zod. Schemas live next to the Server Action that uses them, not in a shared
schemas/ directory. Every action parses its input as the first statement.

Why: a schema describes one HTTP payload, not a domain concept — keeping it
beside its action means the action and its contract are read together.
Inside lib/domain/, TypeScript types are enough, since callers are trusted.

## Testing

Vitest against lib/domain/. Playwright for a handful of smoke paths.
bin/verify runs both.

Tests hit a real Postgres. Never mock the database or modules we own. Faking
time, or a third-party HTTP boundary, is fine — fake what we don't control.
Vitest tests run inside a transaction that is rolled back; Playwright runs
against seeded data.

Real game logs are frozen as fixtures with their expected parse output. The
parser is tested only against those — never against generated logs. A log that
surprises us gets added to the fixtures and stays there.

Fishery factories build database rows for tests that need many matches in a
specific arrangement (streaks, win rates). Factory defaults come from a real
parsed match, not invented values. Factories build rows, never logs.

Why: the queries are the logic, so a mocked database asserts that we called a
function rather than that the SQL is right. Real logs catch the cases we would
never think to write by hand — concessions, timeouts, unfamiliar decks — while
factories cover the arrangements no fixed set of real logs contains.

## Components

UI primitives live in app/components/ui/. They are copied into the repo and
owned here, not imported from a component library. Adding one means adding a
file, not a dependency.

Primitives are presentational: they take props and render. No data fetching,
no server actions, no business rules.

Feature components live next to the route that uses them. A component is
promoted to ui/ only when a second route needs it.

shadcn is a source to copy from, not a dependency to adopt. Components that
need real accessibility machinery — dialog, combobox, date picker — are pulled
in individually when they are actually needed, and the base is chosen then.

Why: copied components can be edited to fit instead of worked around, and a
library upgrade can never change how the app looks. Waiting for a second caller
before extracting keeps us from designing abstractions we haven't seen yet.

## Styling

Tailwind. Utility classes inline. No CSS modules, no styled-components, no
component library.

Mobile first: write the base styles for small screens and add breakpoints
upward. Never the reverse.

Light and dark from the start, via Tailwind's dark: variant. Colors come from
semantic tokens, never hardcoded values — no bg-white or text-gray-900 in
components.

Tabular data renders as cards on mobile and a table from md: upward.

Why: one way to style things, and the constraints only stay true if they are
followed from the first component. Retrofitting dark mode means auditing every
color in the app.

## Dependencies

pnpm. Lockfile committed, --frozen-lockfile in CI.

Pin to exact versions. No carets. Upgrades are scheduled work, never something
that arrives with an install.

Why: strict node_modules means an undeclared dependency is not importable, so
the dependency list stays honest. Next ships breaking changes on a fast cadence
and this is a free-time project — nothing should be able to break it on a Tuesday.

## Linting and formatting

ESLint, with a deliberately small ruleset: next/core-web-vitals, typescript
recommended, and the custom rules that encode this file's boundaries. Nothing
else. Prettier for formatting, applied on write, never discussed.

TypeScript strict, plus noUncheckedIndexedAccess. No `any`, no `@ts-ignore`.

Why: the only rules worth having are the ones that encode decisions. Style
rules we didn't choose are noise, and noise teaches us to ignore lint output.
ESLint stays because the boundary rules are custom ones only it can express.

## Commands

bin/setup brings the project from a cold clone to running, database included.
bin/dev starts everything. bin/verify runs format, lint, typecheck, tests, and
build, and exits nonzero if any of them fail.

Why: one way to run things, so neither a new machine nor an agent has to guess.
