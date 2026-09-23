import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DeckWithRecord } from "@/lib/domain/decks";
import type { Game } from "@/lib/domain/games";
import { Button, ButtonLink } from "../components/ui/button";
import { DeckCard } from "../components/ui/deck-card";
import { Input, Textarea } from "../components/ui/field";
import { GameCard } from "../components/ui/game-card";
import { GlyphLink } from "../components/ui/glyph-link";
import { Mark } from "../components/ui/mark";
import { Menu } from "../components/ui/menu";
import { Panel } from "../components/ui/panel";
import { RecordBadge } from "../components/ui/record-badge";
import { StatusList } from "../components/ui/status-list";
import { Reveal } from "../components/ui/reveal";
import { Caption, Heading } from "../components/ui/text";
import { TextBox } from "../components/ui/text-box";

export const metadata: Metadata = { title: "Styleguide · rotom.gg" };

// Every primitive and pattern, rendered from the real components with fixed
// data. It needs no sign-in, so test/e2e/visual.spec.ts can screenshot it,
// and it's the reference to compare new UI against. Not served in production.

const created = new Date("2026-01-01T00:00:00Z");

const decks: DeckWithRecord[] = [
  {
    id: 1,
    userId: "user_red",
    title: "Mega Lucario ex",
    wins: 5,
    losses: 2,
    createdAt: created,
  },
  {
    id: 2,
    userId: "user_red",
    title: "Gholdengo",
    wins: 0,
    losses: 3,
    createdAt: created,
  },
  {
    id: 3,
    userId: "user_red",
    title: "A deck title long enough to be truncated on a phone",
    wins: 0,
    losses: 0,
    createdAt: created,
  },
];

const log = `Setup
Red chose tails for the opening coin flip.
Blue won the coin toss.
Blue decided to go first.

Red's Turn
Red drew Lillie's Determination.
Red's Mega Lucario ex used Aura Jab on Blue’s Toxel for 260 damage.
- Damage breakdown:
   • Base damage: 130 damage
   • Weakness to Fighting: 130 damage
No Benched Pokémon for backup. Red wins.`;

const game = (overrides: Partial<Game>): Game => ({
  id: 1,
  deckId: 1,
  log,
  result: null,
  wonCoinToss: null,
  coinTossChoice: null,
  wentFirst: null,
  turnCount: null,
  opponentPokemon: null,
  maxDamage: null,
  opponentMaxDamage: null,
  language: null,
  createdAt: created,
  ...overrides,
});

const games: Game[] = [
  game({
    id: 3,
    result: "win",
    wonCoinToss: false,
    coinTossChoice: "first",
    wentFirst: false,
    turnCount: 8,
  }),
  game({
    id: 2,
    result: "loss",
    wonCoinToss: true,
    coinTossChoice: "first",
    wentFirst: true,
    turnCount: 12,
  }),
  game({ id: 1 }),
];

export default function StyleguidePage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-10 px-4 py-6">
      <Heading>Styleguide</Heading>

      <Section title="Type · IBM Plex Sans, the business">
        <p className="wordmark text-hero">88</p>
        <p className="text-display font-semibold">Display 44</p>
        <p className="text-heading font-semibold">Heading 33</p>
        <p className="text-title">Title 22 — field reports for your games.</p>
        <p className="text-body">
          Body 16.5 — Red drew Lillie&apos;s Determination and played it.
        </p>
        <p className="text-body font-semibold">Body 16.5 semibold</p>
      </Section>

      <Section title="Type · Departure Mono, the party">
        <p className="font-mono text-body">MONO 16.5 — W 05 · L 02 · 71%</p>
        <p className="font-mono text-meta">
          Meta 11 — Blue took 130 more damage because of Fighting Weakness.
        </p>
        <Caption>Caption — games on file: 3</Caption>
        <p className="flex flex-wrap gap-4">
          <GlyphLink href="/styleguide">&gt; Decks</GlyphLink>
          <GlyphLink href="/styleguide">&lt; Back</GlyphLink>
          <GlyphLink href="/styleguide">x Delete deck</GlyphLink>
        </p>
      </Section>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-2 font-mono text-meta uppercase">
          <Swatch className="border-2 border-border bg-background text-foreground">
            background
          </Swatch>
          <Swatch className="border-2 border-border bg-surface text-surface-foreground">
            surface
          </Swatch>
          <Swatch className="bg-muted text-background">muted</Swatch>
          <Swatch className="bg-border text-accent-foreground">border</Swatch>
          <Swatch className="bg-rule text-foreground">rule</Swatch>
          <Swatch className="bg-accent text-accent-foreground">accent</Swatch>
          <Swatch className="bg-win text-win-foreground">win</Swatch>
          <Swatch className="bg-loss text-loss-foreground">loss</Swatch>
          <Swatch className="bg-info text-background">info</Swatch>
        </ul>
        <ul className="grid grid-cols-3 gap-2 font-mono text-meta uppercase">
          <Swatch className="border-2 border-border text-spectrum-orange">
            spectrum-orange
          </Swatch>
          <Swatch className="border-2 border-border text-spectrum-blue">
            spectrum-blue
          </Swatch>
          <Swatch className="border-2 border-border text-spectrum-purple">
            spectrum-purple
          </Swatch>
        </ul>
      </Section>

      <Section title="Wordmark">
        <p className="wordmark spectrum text-center text-display md:text-hero">
          ROTOM.GG
        </p>
        <p className="wordmark text-title">ROTOM.GG</p>
      </Section>

      <Section title="Panel">
        <Panel title="01 · Request access">
          <p>A framed box on the surface, with its title cut into the edge.</p>
        </Panel>
        <Panel title="02 · System">
          <StatusList
            lines={[
              { key: "Log parser", value: "Online", tone: "ok" },
              { key: "Languages", value: "EN FR DE", tone: "blue" },
              { key: "Format", value: "Standard", tone: "purple" },
              { key: "Reads", value: "Decks · Games", tone: "orange" },
              { key: "Turns", value: "08" },
            ]}
          />
        </Panel>
      </Section>

      <Section title="Text box">
        <TextBox>No decks on file yet. Name one above to start.</TextBox>
      </Section>

      <Section title="Marks">
        <div className="flex flex-wrap gap-2">
          <Mark tone="win">Win</Mark>
          <Mark tone="loss">Loss</Mark>
          <Mark tone="neutral">Unknown</Mark>
        </div>
      </Section>

      <Section title="Record">
        <RecordBadge wins={5} losses={2} winRate={71} />
        <RecordBadge wins={0} losses={3} winRate={0} />
        <RecordBadge wins={0} losses={0} winRate={undefined} />
      </Section>

      <Section title="Controls">
        <div className="flex gap-2">
          <Input
            placeholder="Deck title"
            aria-label="Deck title"
            className="min-w-0 flex-1"
          />
          <Button>+ New</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/styleguide">+ Add game</ButtonLink>
          <Button disabled>Filing…</Button>
        </div>
        <Textarea
          rows={3}
          placeholder="Paste a game log from Pokémon TCG Live"
          aria-label="Game log"
          className="font-mono text-meta"
        />
      </Section>

      <Section title="Menu · decks">
        <Panel title={`Decks · ${decks.length}`} flush>
          <Menu>
            {decks.map((deck, index) => (
              <Reveal key={deck.id} index={index}>
                <DeckCard deck={deck} />
              </Reveal>
            ))}
          </Menu>
        </Panel>
      </Section>

      <Section title="Menu · games">
        <Panel title={`Games · ${games.length}`} flush>
          <Menu>
            {games.map((game, index) => (
              <Reveal key={game.id} index={index}>
                <GameCard game={game} open={index === 0} />
              </Reveal>
            ))}
          </Menu>
        </Panel>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <Caption as="h2" className="border-b-2 border-border pb-1">
        {title}
      </Caption>
      {children}
    </section>
  );
}

function Swatch({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return <li className={`px-3 py-4 ${className}`}>{children}</li>;
}
