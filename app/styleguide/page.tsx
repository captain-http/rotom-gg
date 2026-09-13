import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { DeckWithRecord } from "@/lib/domain/decks";
import type { Game } from "@/lib/domain/games";
import { Button } from "../components/ui/button";
import { DeckCard } from "../components/ui/deck-card";
import { Input, Textarea } from "../components/ui/field";
import { GameCard } from "../components/ui/game-card";
import { Mark } from "../components/ui/mark";
import { Reveal } from "../components/ui/reveal";
import { Caption, Heading } from "../components/ui/text";

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
      <Heading className="uppercase">Styleguide</Heading>

      <Section title="Type">
        <p className="text-hero">88</p>
        <p className="text-display">Display 44</p>
        <p className="text-heading">Heading 33</p>
        <p className="text-title">Title 22</p>
        <p className="text-body">
          Body 16.5 — Red drew Lillie&apos;s Determination.
        </p>
        <p className="text-meta">
          Meta 11 — Blue took 130 more damage because of Fighting Weakness.
        </p>
        <Caption>Caption — games on file: 3</Caption>
      </Section>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-2 text-meta uppercase">
          <Swatch className="bg-background text-foreground border border-border">
            background
          </Swatch>
          <Swatch className="bg-surface text-surface-foreground">
            surface
          </Swatch>
          <Swatch className="bg-highlight text-highlight-foreground">
            highlight
          </Swatch>
          <Swatch className="bg-mark text-mark-foreground">mark</Swatch>
          <Swatch className="bg-accent text-accent-foreground">accent</Swatch>
          <Swatch className="bg-inverse text-inverse-foreground">
            inverse
          </Swatch>
          <Swatch className="bg-win text-win-foreground">win</Swatch>
          <Swatch className="bg-loss text-loss-foreground">loss</Swatch>
        </ul>
      </Section>

      <Section title="Marks">
        <div className="flex flex-wrap gap-2">
          <Mark tone="win">Win</Mark>
          <Mark tone="loss">Loss</Mark>
          <Mark tone="neutral">Unknown</Mark>
        </div>
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
        <Textarea
          rows={3}
          placeholder="Paste a game log from Pokémon TCG Live"
          aria-label="Game log"
          className="text-meta"
        />
        <p className="flex items-center gap-4 tracking-wider uppercase">
          <span className="px-1">&gt; Link</span>
          <span className="bg-mark px-1 text-mark-foreground">
            &gt; Link hovered
          </span>
        </p>
      </Section>

      <Section title="Callout">
        <p className="border-l-[7px] border-muted py-2 pl-3 text-meta tracking-wider text-muted uppercase">
          Field reports for your
          <br />
          Pokémon TCG Live games
        </p>
      </Section>

      <Section title="Decks">
        <ul className="flex flex-col gap-2">
          {decks.map((deck, index) => (
            <Reveal key={deck.id} index={index}>
              <DeckCard deck={deck} />
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section title="Games">
        <ul className="flex flex-col gap-2">
          {games.map((game, index) => (
            <Reveal key={game.id} index={index}>
              <GameCard game={game} open={index === 0} />
            </Reveal>
          ))}
        </ul>
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
      <Caption as="h2">{title}</Caption>
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
