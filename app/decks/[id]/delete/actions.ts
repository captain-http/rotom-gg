"use server";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { deleteDeck } from "@/lib/domain/decks";

const DeleteDeckInput = z.object({
  deckId: z.coerce.number().int().positive(),
});

export async function deleteDeckAction(formData: FormData) {
  const { deckId } = DeleteDeckInput.parse({ deckId: formData.get("deckId") });
  const { userId } = await auth.protect();

  if (!(await deleteDeck({ userId, deckId }))) {
    notFound();
  }
  redirect("/decks");
}
