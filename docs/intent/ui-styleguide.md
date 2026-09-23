# Intent: the rotom.gg style guide

Confirmed with the owner on 2026-09-22, in an interview. The style guide
(`.claude/skills/rotom-design/SKILL.md` and `/styleguide`) is written from this;
when the two disagree, this wins until it is changed on purpose.

## Outcome

rotom.gg looks like a **modern mullet**: business in front, party in the back.
Clearly and proudly retro — authentic weird, worn with pride, not irony — and
pleasant to use every day. Never a costume (pixelactui.com is the example of
going too far: retro, but not pleasant to use today).

## The owner's retro

A Commodore 64, a Kraftwerk album, an IBM computer, a Game Boy playing Pokémon
Red or Blue, an NES. A TUI person.

## Decisions

- **Type.** IBM Plex Sans is the business: reading, forms, body. Departure Mono
  is the party: labels, figures, records, logs, menus.
- **Color.** Gruvbox over NES: a closed, warm, muted, named palette in light
  and dark. Every color has a job; nothing outside the palette.
- **Shape.** Square, flat, no radius, no shadows. The waitlist field's double
  frame on focus (border plus offset outline) is kept and becomes the
  signature for focus and selection.
- **Structure.** The Game Boy (Pokémon Red/Blue) menu is the TUI model:
  bordered boxes, a `▶` cursor, a text box. ncurses is flavor only.
- **Atmosphere.** CRT and a Stranger Things vibe only as a background texture
  or a rare effect — never on text or data.
- **Carried over.** Stepped, snappy motion (Kraftwerk). The Plex wordmark with
  Rand's stripes and the MissingNo. corruption, as party moments.
- **One system.** Every page, including `/`: the sleeve is rebuilt in it, not
  kept as its own world.
- **Tiebreak.** Legibility wins.

## Out of scope

Paper, notches, the dot grid, the indigo sky, stars, gradients; strict NES
colors; the Game Boy's four greens; a full keyboard-first UI; scanlines or
glow on content.
