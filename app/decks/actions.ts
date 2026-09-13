"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { createDeck } from "@/lib/domain/decks";

const CreateDeckInput = z.object({
  title: z.string().trim().min(1).max(100),
});

export async function createDeckAction(formData: FormData) {
  const { title } = CreateDeckInput.parse({ title: formData.get("title") });
  const { userId } = await auth.protect();

  await createDeck({ userId, title });
  refresh();
}
