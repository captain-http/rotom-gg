---
name: rotom-design
description: The rotom.gg visual language — a modern mullet: gruvbox color, IBM Plex Mono for reading, Departure Mono for the machine, Game Boy menus. Load before building or restyling any page, component, or style in app/.
---

# rotom.gg design

rotom.gg is a **modern mullet**: business in front, party in the back. The
front — reading a log, adding a game, checking a record — is calm, legible,
and modern. The back — labels, menus, cursors, the wordmark, rare effects —
is proudly retro: an NES, a Game Boy playing Pokémon Red, a C64, an IBM PC, a
Kraftwerk sleeve. Worn with pride, never as a costume. If a retro touch costs
legibility, it goes: **legibility wins every tie.**

Why each decision was made is in `docs/intent/ui-styleguide.md`.

Tokens and utilities live in `app/globals.css`. Primitives live in
`app/components/ui/`. **`/styleguide`** (`app/styleguide/page.tsx`) renders
every primitive and pattern from the real components — open it before
building, and compare your work against it.

Three checks back this document up, all in `bin/verify`:

- **The theme only knows rotom.gg tokens.** Tailwind's default palette,
  radii, and shadows are removed, so `bg-white` or `rounded-lg` render
  nothing.
- **ESLint rejects off-system classes** (`eslint-rules/design-classes.js`)
  with the reason and the token to use instead.
- **Screenshot tests** (`test/e2e/visual.spec.ts`) compare `/` and
  `/styleguide` on mobile and desktop against committed images.

## Type: two faces, two jobs

| Face               | Job          | Class       | Sets                                                     |
| ------------------ | ------------ | ----------- | -------------------------------------------------------- |
| **IBM Plex Mono**  | the business | `font-sans` | body text, names, descriptions, forms, buttons, headings |
| **Departure Mono** | the party    | `font-mono` | labels, figures, records, logs, menu items, panel titles |

`font-sans` is the default on `body`: reach for `font-mono` on purpose. The
class keeps Tailwind's name, but it sets Plex Mono — both faces are
monospaced. They still read apart: Plex Mono is smooth, Departure Mono is
pixels. Plex Mono runs wider than a sans, so leave names room to truncate.

- **Plex Mono has two weights**, `font-normal` (400) and `font-semibold` (600).
  Headings and emphasis use 600. No other weights, no italics.
- **Departure Mono has one weight** and is never bolded — the browser would
  fake it. Its contrast comes from size, uppercase, tracking, and color.
- **Sizes are multiples of 11px**, the grid Departure Mono is drawn on. Plex Mono
  uses the same scale so the two faces share a rhythm. Only these exist:

  | Class          | Size   | Use                                         |
  | -------------- | ------ | ------------------------------------------- |
  | `text-meta`    | 11px   | mono labels, counts, facts, logs            |
  | `text-body`    | 16.5px | default text, buttons, inputs (no iOS zoom) |
  | `text-title`   | 22px   | panel headings                              |
  | `text-heading` | 33px   | page headings, the header wordmark          |
  | `text-display` | 44px   | the wordmark on mobile                      |
  | `text-hero`    | 88px   | the wordmark from `md:` up                  |

- **Labels** are `font-mono text-meta tracking-wider uppercase text-muted` —
  use `Caption`, not the classes.
- **Figures line up**: records, counts, and win rates are Departure Mono so
  digits sit in columns.
- **Links are prefixed with a glyph**, not underlined: `> Decks` forward,
  `< Decks` back, `+ New` for creating.

## Color: a closed gruvbox palette

The palette is [gruvbox](https://github.com/morhetz/gruvbox) — warm, muted,
retro, and built to be stared at all day. It is **closed**: every color in
the app is a token below, and every token has a job. No raw hex in
components, no Tailwind palette, no new colors without a new job.

| Token                            | Value                 | Job                                          |
| -------------------------------- | --------------------- | -------------------------------------------- |
| `background` / `foreground`      | `#282828` / `#ebdbb2` | the screen                                   |
| `surface` / `surface-foreground` | `#32302f` / `#ebdbb2` | panels, fields — opaque, over the CRT ground |
| `muted`                          | `#a89984`             | labels, secondary text                       |
| `border`                         | `#928374`             | frames: panels, fields, buttons              |
| `rule`                           | `#504945`             | hairlines between rows, never a frame        |
| `accent` (+ `-foreground`)       | `#fabd2f` / `#282828` | focus, selection, the `▶` cursor, hover      |
| `win` (+ `-foreground`)          | `#b8bb26` / `#282828` | wins and winning records                     |
| `loss` (+ `-foreground`)         | `#fb4934` / `#1d2021` | losses                                       |
| `info`                           | `#83a598`             | links in running text, neutral notices       |

Every text pair above clears 4.5:1, and frames clear 3:1 against the ground.
Check a new pair before adding it.

- **Yellow is the cursor.** It means "you are here": focus, selection, hover.
  Don't use it for decoration or for wins.
- **Wins are green, losses red** — and the `W`/`L` letter always travels with
  the color, so the record reads without it.
- **The spectrum** is gruvbox's seven hues as their own tokens (`--red`,
  `--orange`, `--yellow`, `--green`, `--aqua`, `--blue`, `--purple`; the
  gruvbox dark's bright set). It has two jobs and no others:
  - **The wordmark** (`.wordmark.spectrum`): one hue per bar, red to
    purple, like the rainbow stripes on 80s computer boxes, on the sleeve
    and in the header. The loudest thing in the system, and only there.
  - **Status values** (`StatusList`): colored by kind, the way an editor
    colors code. Only `text-spectrum-orange`, `-blue`, and `-purple` are
    classes — red doesn't read as small text on a panel, and yellow,
    green, and aqua already mean the cursor, a win, and nothing yet. A good state is a green `ok` block, like a win.
- **One scheme: dark.** rotom.gg is a screen at night, whatever the system
  asks for — `color-scheme: dark` on `:root`, no `prefers-color-scheme`
  queries, no `dark:` variants. The owner chose this on 2026-09-22 after
  seeing both live.

## Shape: square, flat, framed

- **No radius, no shadows, no gradients** in components. Depth comes from
  frames and fills, like a Game Boy menu drawn in tiles.
- **Panels** are the unit of layout: `Panel` — a 2px `border` frame on
  `surface`, with an optional title set into the top edge in Departure Mono
  (`─ DECKS ──────`, the `panel-title` utility), the way a TUI or a Pokémon
  menu labels a box. Pass `flush` when it holds a `Menu`.
- **The double frame is the signature.** A focused control gets its own 2px
  border in `accent` (`focus-visible:border-accent`, built into the
  primitives) plus the global `:focus-visible` outline, 2px `accent` sitting
  2px outside it — two nested frames. Menu rows have no border, so they
  pull the outline inside the panel and show the `▶` cursor instead.
- **Rows inside a panel** are separated by `rule` hairlines, never by frames
  nested in frames.

## Structure: the Game Boy menu

The model is Pokémon Red/Blue's menus, not a full terminal app.

- **Menus** (`Menu`, `MenuItem`) are lists of choices inside a panel. The
  hovered or focused item shows a `▶` cursor in `accent`; its column is
  always reserved, so nothing shifts.
- **The text box** (`TextBox`) is for messages from the app — a confirmation,
  an empty state, an error: a framed panel at full width with a blinking `▼`
  at the end of the line.
- **Status lines** (`StatusList`) are mono `text-meta` rows of `KEY VALUE`
  pairs, like the sleeve's `SYSTEM` block: muted keys, values in a
  spectrum color by kind.
- **Box-drawing characters** (`─ │ ┌ ┐`) are allowed in panel titles and logs.
  Never draw a frame out of characters where a border would do.
- **The mouse and touch come first.** No keyboard-only interactions; a
  shortcut may be added only as a shortcut to something clickable.

## Atmosphere: CRT in the back

- **The ground is a screen at night**: `body` carries a faint scanline
  texture (the `body` rule in `globals.css`). Panels, fields, and text boxes
  are opaque, so data never sits on the texture.
- **Effects are moments, not styles**: at most one per page, never on data.
  - `.corrupt` — MissingNo.: bands of the wordmark slip sideways on a rare
    beat, stepped. Needs `data-text` matching its own text.
  - `animate-power-on` — a CRT power-on flicker, for the sleeve's first
    paint.
- **No** scanlines on panels, glow on text, screen curvature, or flicker
  that repeats.

## The wordmark

`.wordmark` sets IBM Plex Sans 700, untracked, with Paul Rand's bars cut through the
letterforms. It's the only use of Plex Sans: the bars are tuned to its
metrics. It's the brand, and it appears in two places: large on `/`, in
the spectrum (`.spectrum`), and at `text-heading` in the header, in the
spectrum too.
Nothing else uses the bars.

## The sleeve

`/` is the landing page: the wordmark, what rotom.gg does, and its status.
It's built from the same tokens and primitives as the app — the loudest page
in the system, not its own world.
It may use the wordmark at `text-hero`, `.corrupt`, and `animate-power-on`;
it may not add colors, grounds, or variants of primitives.

## Motion

CSS only, few moments, and snappy — stepped, not smooth (Kraftwerk, not
Apple).

- **Hover:** `transition-colors duration-75 ease-flick`. Menu items show the
  `▶` cursor; buttons fill with `accent`.
- **Lists step in on load:** `Reveal index={i}`.
- **Blinking** (`animate-blink`) is for the text box's `▼` only.
- `prefers-reduced-motion` turns all of it off globally; don't re-enable it.

## Primitives

- `Panel title?` — the framed box everything sits in.
- `Menu`, `MenuItem` — choices with the `▶` cursor. `MenuItem` renders a
  link or a button.
- `TextBox` — a message from the app, with the blinking `▼`.
- `GlyphLink` — a mono link that says where it goes with its glyph; fills
  yellow under the cursor.
- `Button` — 2px frame, Plex Mono `text-body`, fills with `accent` on hover.
  Spreads props, so Clerk wrappers like `<SignInButton>` can use it as their
  child. `ButtonLink` looks the same but navigates.
- `Input`, `Textarea` — a 2px frame on `surface`; the double frame on focus.
- `Mark tone="win" | "loss" | "neutral"` — a small mono block. `neutral`
  for unknowns and zero counts, so color appears only when something
  happened.
- `Heading` — a page title in Plex Mono 600. `Caption` — mono label; pass
  `as="h2" | "label" | "span"`.
- `StatusList lines` — terminal status lines; each line is `{ key, value,
tone? }` with `tone` one of `ok`, `orange`, `blue`, `purple`.
- `Reveal index={i}` — a list item that steps in on load.
- `DeckCard`, `GameCard` — decks and games as menu items in a panel.
- `RecordBadge wins losses winRate` — `W 05` / `L 02` as joined halves,
  with the win rate beside it.

Reach for a primitive before writing classes. A pattern used on two routes
becomes a primitive in `app/components/ui/` and gets a section in
`/styleguide`.

## Layout

- Mobile first. Pages are `mx-auto w-full max-w-xl flex flex-col gap-6 px-4
py-6`.
- The header runs full width, ruled off below by a 2px `border` bar — the
  same bar as the sleeve's masthead. The sleeve hides it, since its masthead
  already draws one.
- Spacing steps by 5.5px (`--spacing`), so `p-2` is 11px and `p-4` is 22px —
  the same grid as the type.
- Tabular data renders as a menu on mobile and a table from `md:` up.

## Avoid

- Departure Mono in paragraphs, or Plex Mono for labels and figures.
- Weights other than Plex Mono 400/600; Plex Sans outside the wordmark; any weight on Departure Mono; italics.
- Tailwind's default text sizes (`text-sm`, `text-lg`, …).
- Rounded corners, shadows, gradients, glassmorphism, emoji as icons.
- Any color outside the tables, or a spectrum hue outside its two jobs.
- Retro that costs legibility: scanlines or glow on text, pixel fonts at
  length, frames drawn in characters.
- Client components for effects — motion is CSS.

## Open

Decided by the guide's author, not yet by the owner — confirm or change:

- Energy types, if the app ever colors cards by type: Fire red, Water
  blue, Grass green, Lightning yellow, Psychic purple, Fighting orange,
  Darkness and Metal from the neutrals — a third job for the spectrum.
- The palette is gruvbox's own values, not a variant of them.

## Verify your work

Before calling UI work done:

1. `bin/verify` passes — lint catches off-system classes.
2. Look at the page yourself: screenshot it with Playwright
   at 390px and 1280px wide. Compare with `/styleguide`, and check it
   against **Avoid**.
3. Anything new and reusable is added to `/styleguide`.
4. If the screenshot tests fail, open the diff in `playwright-report/`. A
   change you didn't intend is a bug — fix it. A change you did intend:
   run `pnpm exec playwright test test/e2e/visual.spec.ts
--update-snapshots`, look at every updated image, and commit them with
   the change. Never update snapshots just to make the test pass.
