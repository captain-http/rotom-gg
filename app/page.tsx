import type { Metadata } from "next";
import { Panel } from "./components/ui/panel";
import { StatusList } from "./components/ui/status-list";
import { Caption } from "./components/ui/text";

export const metadata: Metadata = {
  title: "rotom.gg",
  description: "Field reports for your Pokémon TCG Live games.",
};

// The sleeve: the landing page. Built from the app's own tokens
// and primitives — the loudest page in the system, not a world of its own.
// data-sleeve hides the header's copy of the wordmark (app/globals.css).
export default function Home() {
  return (
    <main
      data-sleeve
      className="mx-auto flex w-full max-w-xl flex-1 animate-power-on flex-col justify-center gap-8 px-4 py-12"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b-2 border-border pb-2">
          <Caption>RTM-01</Caption>
          <Caption>Alpha</Caption>
        </div>

        <h1
          className="wordmark spectrum corrupt text-center text-display md:text-hero"
          data-text="ROTOM.GG"
        >
          ROTOM.GG
        </h1>

        <p className="text-title">
          Field reports for your Pokémon TCG Live games.
        </p>
      </div>

      <Panel title="01 · System">
        <StatusList
          lines={[
            { key: "Log parser", value: "Online", tone: "ok" },
            { key: "Languages", value: "EN FR DE IT ES PT", tone: "blue" },
            { key: "Format", value: "Standard", tone: "purple" },
            { key: "Reads", value: "Decks · Games · Win rate", tone: "orange" },
          ]}
        />
      </Panel>
    </main>
  );
}
