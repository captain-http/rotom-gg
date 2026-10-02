"use server";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { renameDeck } from "@/lib/domain/decks";
import { DeckTitle } from "../../deck-title";

const RenameDeckInput = z.object({
  deckId: z.coerce.number().int().positive(),
  title: DeckTitle,
});

export async function renameDeckAction(formData: FormData) {
  const { deckId, title } = RenameDeckInput.parse({
    deckId: formData.get("deckId"),
    title: formData.get("title"),
  });
  const { userId } = await auth.protect();

  if (!(await renameDeck({ userId, deckId, title }))) {
    notFound();
  }
  redirect(`/decks/${deckId}`);
}
