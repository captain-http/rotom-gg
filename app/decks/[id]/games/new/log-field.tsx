"use client";

// Client component: reading the clipboard needs the browser's Clipboard API.

import { useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/field";
import { Caption } from "../../../../components/ui/text";

// The battle log textarea with a button that fills it from the clipboard, so
// a log copied in Pokémon TCG Live takes one tap instead of a long-press.
export function LogField() {
  const field = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function paste() {
    setMessage(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setMessage("The clipboard is empty. Copy the log in TCG Live first.");
        return;
      }
      if (field.current) {
        field.current.value = text;
        field.current.focus();
      }
    } catch {
      setMessage(
        "Couldn't read the clipboard. Long-press the box and choose Paste.",
      );
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Caption as="label" htmlFor="log">
          File a battle log
        </Caption>
        <Button onClick={paste}>Paste from clipboard</Button>
      </div>
      {message && (
        <p role="status" className="text-meta tracking-wider uppercase">
          <span className="bg-mark px-1 text-mark-foreground">{message}</span>
        </p>
      )}
      <Textarea
        ref={field}
        id="log"
        name="log"
        required
        rows={16}
        placeholder="Paste a game log from Pokémon TCG Live"
        className="text-meta"
      />
    </>
  );
}
