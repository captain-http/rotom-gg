import { auth } from "@clerk/nextjs/server";

export default async function DecksPage() {
  const { userId } = await auth.protect();

  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold">Decks</h1>
      <p>Signed in as {userId}</p>
    </main>
  );
}
