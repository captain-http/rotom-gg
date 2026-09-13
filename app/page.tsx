import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">rotom.gg</h1>
      <p>Track your Pokémon TCG Live games.</p>
      <Link href="/decks" className="underline">
        Go to your decks
      </Link>
    </main>
  );
}
