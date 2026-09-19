"use client";

// Client component: useActionState shows the action's error without a reload.

import { useActionState } from "react";
import { Button } from "../../../../components/ui/button";
import { createGameAction, type CreateGameState } from "./actions";
import { LogField } from "./log-field";

const INITIAL: CreateGameState = { error: null };

export function NewGameForm({ deckId }: { deckId: number }) {
  const [state, action, pending] = useActionState(createGameAction, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="deckId" value={deckId} />
      <LogField />
      {state.error && (
        <p role="alert" className="text-meta tracking-wider uppercase">
          <span className="bg-mark px-1 text-mark-foreground">
            {state.error}
          </span>
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Filing…" : "+ Add game"}
      </Button>
    </form>
  );
}
