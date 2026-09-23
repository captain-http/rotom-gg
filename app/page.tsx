import type { Metadata } from "next";
import { joinWaitlistAction } from "./actions";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/field";
import { Panel } from "./components/ui/panel";
import { Caption } from "./components/ui/text";
import { TextBox } from "./components/ui/text-box";

export const metadata: Metadata = {
  title: "rotom.gg",
  description:
    "Field reports for your Pokémon TCG Live games. Join the waitlist.",
};

// The sleeve: the pre-release landing page. Built from the app's own tokens
// and primitives — the loudest page in the system, not a world of its own.
// data-sleeve hides the header's copy of the wordmark (app/globals.css).
export default async function Home({ searchParams }: PageProps<"/">) {
  const { status } = await searchParams;
  const filed = status === "filed";
  const rejected = status === "rejected";

  return (
    <main
      data-sleeve
      className="mx-auto flex w-full max-w-xl flex-1 animate-power-on flex-col justify-center gap-8 px-4 py-12"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b-2 border-border pb-2">
          <Caption>Pokémon TCG Live</Caption>
          <Caption>Pre-release</Caption>
        </div>

        <h1
          className="wordmark corrupt text-center text-display md:text-hero"
          data-text="ROTOM.GG"
        >
          ROTOM.GG
        </h1>

        <p className="text-title">
          Field reports for your Pokémon TCG Live games.
        </p>
      </div>

      {filed ? (
        <TextBox role="status">
          You&apos;re on the list. One mail when it opens, nothing else.
        </TextBox>
      ) : (
        <Panel title="01 · Request access">
          <form action={joinWaitlistAction} className="flex gap-2">
            <Input
              type="email"
              name="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              aria-label="Email address"
              autoComplete="email"
              className="min-w-0 flex-1"
            />
            <Button type="submit">Join</Button>
          </form>
          <Caption>
            {rejected
              ? "That address didn't parse. Try again."
              : "One mail when it opens. Nothing else, ever."}
          </Caption>
        </Panel>
      )}

      <Panel title="02 · System">
        <pre className="font-mono text-meta whitespace-pre-wrap text-muted">
          {`LOG PARSER      ONLINE
LANGUAGES       EN FR DE IT ES PT
FORMAT          STANDARD
READS           DECKS · GAMES · WIN RATE`}
        </pre>
      </Panel>
    </main>
  );
}
