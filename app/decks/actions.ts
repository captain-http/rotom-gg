"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { createDeck } from "@/lib/domain/decks";
import { DeckTitle } from "./deck-title";

const CreateDeckInput = z.object({
  title: DeckTitle,
});

export async function createDeckAction(formData: FormData) {
  const { title } = CreateDeckInput.parse({ title: formData.get("title") });
  const { userId } = await auth.protect();

  await createDeck({ userId, title });
  refresh();
}
