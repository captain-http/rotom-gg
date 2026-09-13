---
name: rotom-design
description: The rotom.gg visual language — retro, lo-fi technical, after departuremono.com. Load before building or restyling any page, component, or style in app/.
---

# rotom.gg design

rotom.gg is a trainer's research lab: games are field reports filed on paper.
The look is taken from [departuremono.com](https://www.departuremono.com/) —
paper grounds, soft ink, one amber accent, highlighter blocks, and a pixel
font kept on its grid. Calm and technical, never glossy.

Tokens and utilities live in `app/globals.css`. Primitives live in
`app/components/ui/`. **`/styleguide`** (`app/styleguide/page.tsx`) renders
every primitive and pattern from the real components — open it before
building, and compare your work against it.

Three checks back this document up, all in `bin/verify`:

- **The theme only knows rotom.gg tokens.** Tailwind's default palette,
  weights, radii, and shadows are removed, so `bg-white` or `font-bold`
  render nothing.
- **ESLint rejects off-system classes** (`eslint-rules/design-classes.js`)
  with the reason and the token to use instead.
- **Screenshot tests** (`test/e2e/visual.spec.ts`) compare `/` and
  `/styleguide` in light, dark, mobile, and desktop against committed images.

## Typography

- **One face, one weight:** Departure Mono. Never use `font-bold`,
  `font-semibold`, or any weight — it only has 400, and the browser fakes the
  rest. Make contrast with size, uppercase, tracking, and color instead.
- **Sizes are multiples of 11px**, the grid the font is drawn on, so its
  pixels stay crisp. Only these exist (Tailwind's defaults are removed):

  | Class          | Size   | Use                                         |
  | -------------- | ------ | ------------------------------------------- |
  | `text-meta`    | 11px   | labels, counts, facts, logs                 |
  | `text-body`    | 16.5px | default text, buttons, inputs (no iOS zoom) |
  | `text-title`   | 22px   | the header wordmark                         |
  | `text-heading` | 33px   | page headings                               |
  | `text-display` | 44px   | hero on mobile                              |
  | `text-hero`    | 88px   | hero from `md:` up                          |

- **Labels are uppercase and tracked:** `text-meta tracking-wider uppercase
text-muted`. Section headings, empty states, and facts use this.
- **Headings sit on a highlight block:** `self-start bg-highlight px-1
text-highlight-foreground`, like a redacted or highlighted title.
- **Links are prefixed with a glyph**, not underlined: `> Decks` forward,
  `< Decks` back, `+ New` for creating.

## Color

Only the semantic tokens below. Never raw colors (`bg-white`, `text-gray-*`,
hex values) in components. Every token has a light and dark value.

| Token                            | Light            | Dark            | Use                                           |
| -------------------------------- | ---------------- | --------------- | --------------------------------------------- |
| `background` / `foreground`      | enamel / dark    | carbon / cement | the page                                      |
| `surface` / `surface-foreground` | white / carbon   | soot / enamel   | paper sheets: cards, fields                   |
| `muted`                          | clay             | ash             | labels, secondary text                        |
| `border`                         | aluminum         | dark            | field borders, rules                          |
| `highlight` (+ `-foreground`)    | aluminum         | dark            | blocks behind headings                        |
| `mark` (+ `-foreground`)         | foam (sage)      | clay            | hover highlighter, blinking cursor            |
| `accent` (+ `-foreground`)       | amber            | amber           | the only accent: hover on buttons, focus ring |
| `inverse` (+ `-foreground`)      | dark / enamel    | cement / carbon | buttons                                       |
| `win` / `loss` (+ `-foreground`) | amber / aluminum | amber / dark    | results and records                           |

Amber is scarce on purpose. It marks wins, focus, and a button under the
cursor — nothing decorative. Never use it for text on paper (too little
contrast); put dark text on an amber block instead.

## Surfaces and texture

- **The page is graph paper:** a faint dot grid on `body`. Don't add other
  backgrounds, gradients, or shadows.
- **Cards are sheets:** `notch bg-surface text-surface-foreground` — the
  `notch` utility cuts the top-right corner like a filed report. No
  `rounded-*`, no `shadow-*`.
- **Logs render as printouts:** `<pre>` with `text-meta whitespace-pre-wrap
border-l-2 border-border pl-3` — a ruled margin down the left edge.
- **Callouts** carry a thick left bar: `border-l-[7px] border-muted pl-3
text-meta uppercase text-muted`.

## Motion

CSS only, few moments, and snappy — stepped, not smooth.

- **Hover:** `transition-colors duration-75 ease-flick` with `hover:bg-mark
hover:text-mark-foreground` on links and cards; buttons go to `bg-accent`.
- **Lists reveal on load:** `animate-reveal
[animation-delay:calc(var(--i)*60ms)]` with `style={{ "--i": index } as
CSSProperties}` on each item.
- **The blinking cursor** (`animate-blink`) is for the hero only.
- `prefers-reduced-motion` turns all of it off globally; don't re-enable it.

## Primitives

- `Button` — inverse panel, uppercase `text-body`. Spreads props, so Clerk
  wrappers like `<SignInButton>` can use it as their child. `ButtonLink`
  looks the same but navigates — for actions that open a page, like
  `+ Add game` → `/decks/1/games/new`.
- `Input`, `Textarea` — a paper sheet with a 2px border that turns amber on
  focus.
- `Mark tone="win" | "loss" | "neutral"` — a small uppercase highlighter
  block. Use `neutral` for unknowns and zero counts, so amber only appears
  when something was actually won.
- `Heading` — a page title on a highlight block. `Caption` — uppercase
  muted meta text; pass `as="h2" | "label" | "span"`.
- `Reveal index={i}` — a list item that steps in on load.
- `DeckCard`, `GameCard` — the deck and game sheets.

Reach for a primitive before writing classes. A pattern used on two routes
becomes a primitive in `app/components/ui/` and gets a section in
`/styleguide`.

## Layout

- Mobile first. Pages are `mx-auto w-full max-w-xl flex flex-col gap-6 px-4
py-6`.
- Spacing steps by 5.5px (`--spacing`), so `p-2` is 11px and `p-4` is 22px —
  the same grid as the type.
- Tabular data renders as cards on mobile and a table from `md:` up.

## Avoid

- Font weights, italics, or any second font.
- Tailwind's default text sizes (`text-sm`, `text-lg`, …) — they don't exist
  here, and off-grid sizes blur the pixels.
- Rounded corners, drop shadows, gradients, glassmorphism, emoji as icons.
- Pure black or pure white text on the page ground.
- Amber as decoration, or more than one accent color.
- Client components for effects — motion is CSS.

## Verify your work

Before calling UI work done:

1. `bin/verify` passes — lint catches off-system classes.
2. Look at the page yourself: screenshot it with Playwright in light and dark,
   at 390px and 1280px wide. Compare with `/styleguide`, and check it
   against **Avoid**.
3. Anything new and reusable is added to `/styleguide`.
4. If the screenshot tests fail, open the diff in `playwright-report/`. A
   change you didn't intend is a bug — fix it. A change you did intend:
   run `pnpm exec playwright test test/e2e/visual.spec.ts
--update-snapshots`, look at every updated image, and commit them with
   the change. Never update snapshots just to make the test pass.
