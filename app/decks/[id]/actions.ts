"use server";

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { createGame } from "@/lib/domain/games";

const CreateGameInput = z.object({
  deckId: z.coerce.number().int().positive(),
  log: z.string().trim().min(1).max(500_000),
});

export async function createGameAction(formData: FormData) {
  const { deckId, log } = CreateGameInput.parse({
    deckId: formData.get("deckId"),
    log: formData.get("log"),
  });
  const { userId } = await auth.protect();

  const game = await createGame({ userId, deckId, log });
  if (!game) {
    notFound();
  }
  refresh();
}
