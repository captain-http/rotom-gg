"use server";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createGame } from "@/lib/domain/games";
import * as logCheck from "@/lib/domain/log-check";

const CreateGameInput = z.object({
  deckId: z.coerce.number().int().positive(),
  log: z.string().trim().min(1).max(500_000),
});

export type CreateGameState = { error: string | null };

export async function createGameAction(
  _state: CreateGameState,
  formData: FormData,
): Promise<CreateGameState> {
  const { deckId, log } = CreateGameInput.parse({
    deckId: formData.get("deckId"),
    log: formData.get("log"),
  });
  const { userId } = await auth.protect();

  const { isLog, language } = await logCheck.check(log);
  if (isLog === false) {
    return {
      error:
        "That doesn't look like a battle log. Copy it from the game's log in TCG Live.",
    };
  }

  const game = await createGame({ userId, deckId, log, language });
  if (!game) {
    notFound();
  }
  // Back to the deck, where the new game is first in the list.
  redirect(`/decks/${deckId}`);
}
