import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <h1 className="text-display text-highlight-foreground md:text-hero">
        <span className="bg-highlight">ROTOM_GG</span>
        <span className="animate-blink" aria-hidden>
          &nbsp;
        </span>
      </h1>

      <p className="border-l-[7px] border-muted py-2 pl-3 text-meta tracking-wider text-muted uppercase">
        Field reports for your
        <br />
        Pokémon TCG Live games
      </p>

      <Link
        href="/decks"
        className="self-start px-1 tracking-wider uppercase transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
      >
        &gt; Go to your decks
      </Link>
    </main>
  );
}
