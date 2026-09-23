import type { Metadata } from "next";
import { joinWaitlistAction } from "./actions";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/field";
import { Caption } from "./components/ui/text";

export const metadata: Metadata = {
  title: "rotom.gg",
  description:
    "Field reports for your Pokémon TCG Live games. Join the waitlist.",
};

// The sleeve: the pre-release landing page, and the only route on the cosmos
// ground (app/globals.css). data-ground is what switches the tokens over, so
// the primitives below are the same ones the app uses on paper.
export default async function Home({ searchParams }: PageProps<"/">) {
  const { status } = await searchParams;
  const filed = status === "filed";
  const rejected = status === "rejected";

  return (
    <main
      data-ground="cosmos"
      className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 py-12"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b border-border pb-2">
          <Caption>Pokémon TCG Live</Caption>
          <Caption>Pre-release</Caption>
        </div>

        <h1
          className="wordmark corrupt text-display md:text-hero"
          data-text="ROTOM.GG"
        >
          ROTOM.GG
        </h1>

        <p className="border-l-[7px] border-muted py-2 pl-3 text-meta tracking-wider text-muted uppercase">
          Field reports for your
          <br />
          Pokémon TCG Live games
        </p>
      </div>

      <section className="notch flex flex-col gap-3 bg-surface p-4 text-surface-foreground">
        <Caption as="h2">
          {filed ? "01 · Filed" : "01 · Request access"}
        </Caption>

        {filed ? (
          <p className="text-body">
            You&apos;re on the list. One mail when it opens, nothing else.
          </p>
        ) : (
          <>
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
          </>
        )}
      </section>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Caption as="h2">02 · System</Caption>
        <pre className="border-l-2 border-border pl-3 text-meta whitespace-pre-wrap text-muted">
          {`LOG PARSER      ONLINE
LANGUAGES       EN FR DE IT ES PT
FORMAT          STANDARD
READS           DECKS · GAMES · WIN RATE`}
        </pre>
      </div>
    </main>
  );
}
