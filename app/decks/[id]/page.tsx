import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { findDeck, findWinRate } from "@/lib/domain/decks";
import { listDays, listGames, listMatchups } from "@/lib/domain/games";
import { ButtonLink } from "../../components/ui/button";
import { DayCard } from "../../components/ui/day-card";
import { GlyphLink } from "../../components/ui/glyph-link";
import { MatchupCard } from "../../components/ui/matchup-card";
import { Menu } from "../../components/ui/menu";
import { Panel } from "../../components/ui/panel";
import { formatWinRate, RecordBadge } from "../../components/ui/record-badge";
import { Reveal } from "../../components/ui/reveal";
import { Tabs } from "../../components/ui/tabs";
import { Heading } from "../../components/ui/text";
import { TextBox } from "../../components/ui/text-box";
import { TIME_ZONE_COOKIE } from "../../time-zone-cookie";

export default async function DeckPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { userId } = await auth.protect();
  const deckId = Number((await params).id);
  if (!Number.isInteger(deckId) || deckId <= 0) {
    notFound();
  }

  const deck = await findDeck({ userId, deckId });
  if (!deck) {
    notFound();
  }
  const games = await listGames({ userId, deckId });
  const winRate = findWinRate(deck);
  // Matchups unless Days is asked for: a mistyped view isn't worth a 404.
  const view = (await searchParams).view === "days" ? "days" : "matchups";
  // The Viewer's, from the cookie TimeZoneSync keeps; UTC until it's there.
  const timeZone = getTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  const thisYear = new Date().toLocaleString("en-US", {
    timeZone,
    year: "numeric",
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <GlyphLink href="/decks" className="self-start">
        &lt; Decks
      </GlyphLink>
      <div className="flex flex-col gap-3">
        <Heading>{deck.title}</Heading>
        {/* The record and the action that changes it share a row. The win
            rate sits with the game count below, so the row fits a phone. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RecordBadge wins={deck.wins} losses={deck.losses} />
          <ButtonLink href={`/decks/${deck.id}/games/new`}>
            + Add game
          </ButtonLink>
        </div>
      </div>

      {games.length === 0 ? (
        <TextBox>No games on file yet. Add one to start the record.</TextBox>
      ) : (
        <div className="flex flex-col gap-3">
          <Tabs
            label="Group games by"
            tabs={[
              {
                label: "Matchups",
                href: `/decks/${deck.id}`,
                current: view === "matchups",
              },
              {
                label: "Days",
                href: `/decks/${deck.id}?view=days`,
                current: view === "days",
              },
            ]}
          />
          <Panel
            title={`Games · ${games.length}${winRate !== undefined ? ` · ${formatWinRate(winRate)}` : ""}`}
            flush
          >
            <Menu>
              {view === "matchups"
                ? listMatchups(games).map((matchup, index) => (
                    <Reveal key={matchup.archetype ?? ""} index={index}>
                      <MatchupCard matchup={matchup} />
                    </Reveal>
                  ))
                : listDays(games, timeZone).map((day, index) => (
                    <Reveal key={day.date} index={index}>
                      <DayCard day={day} thisYear={thisYear} />
                    </Reveal>
                  ))}
            </Menu>
          </Panel>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <GlyphLink href={`/decks/${deck.id}/rename`}>~ Rename deck</GlyphLink>
        <GlyphLink href={`/decks/${deck.id}/delete`}>x Delete deck</GlyphLink>
      </div>
    </main>
  );
}

// The cookie's timezone, if it names one: anyone could have written it.
function getTimeZone(value: string | undefined): string {
  if (value) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return value;
    } catch {
      // Not a timezone; fall through to UTC.
    }
  }
  return "UTC";
}
