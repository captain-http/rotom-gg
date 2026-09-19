/**
 * What TypeSafe's Jev model reads from a pasted battle log: whether it is
 * one, and which language Pokémon TCG Live wrote it in. The parser only
 * knows English sentences; Jev reads any of the game's languages.
 *
 * Every failure — no API key, a timeout, an outage — answers "can't tell",
 * so filing a game never depends on TypeSafe being up.
 */

import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type * as cards from "./cards";

/** A language PTCGL can be played in, as TCGdex codes it. */
export type Language = "en" | cards.Language;

export type Check = {
  /** False only when Jev is sure the text isn't a battle log. */
  isLog: boolean | null;
  language: Language | null;
};

// The setup and first turns: enough to recognize a log and its language,
// and it keeps a 500 KB paste from becoming a 500 KB request.
const SAMPLE_LINES = 60;
const SAMPLE_CHARS = 6000;
// Refusing a real log costs more than filing a stray paste, so only a
// clear no refuses.
const NOT_A_LOG_BELOW = 0.1;
const MIN_LANGUAGE_CONFIDENCE = 0.6;
// Latin American and Spain's Spanish can read the same. When Jev can't split
// them but is sure it's Spanish, Spain's is the table cards falls back to.
const MIN_SPANISH = 0.8;
// The form waits on this, so fail fast rather than retry for half a minute.
const REQUEST = { timeout: 5000, retry: { maxRetries: 1 } };

const QUESTIONS = {
  isLog: noul(
    "Is `log` the start of a battle log exported from Pokémon TCG Live, in any of the game's languages?",
    {
      true: "A turn-by-turn record of a game between two players: opening hands, a coin toss, turns, cards played, attacks, and Prize cards taken.",
      false:
        "Anything else: a decklist, a chat message, notes about a game, or unrelated text.",
    },
  ),
  language: choice(
    "Assuming `log` is a Pokémon TCG Live battle log, which language is the game client writing it in? Judge by the game's sentences and card names, not by the players' usernames.",
    {
      en: "English",
      fr: "French",
      de: "German",
      it: "Italian",
      es: "Spanish as used in Spain",
      "es-mx": "Spanish as used in Latin America",
      pt: "Brazilian Portuguese",
    },
  ),
};

/**
 * Ask Jev whether a pasted text is a battle log, and in which language.
 *
 * Both questions go in one request. Jev sees only the start of the text.
 *
 * @param log - The pasted text.
 * @param client - The TypeSafe client; defaults to one built from
 *   TYPESAFE_API_KEY.
 * @returns What Jev could tell, with null for anything it wasn't sure of
 *   or couldn't be asked.
 * @example
 * await logCheck.check(log); // { isLog: true, language: "en" }
 */
export async function check(
  log: string,
  client?: TypeSafeClient,
): Promise<Check> {
  try {
    const { answers } = await (client ?? new TypeSafeClient()).systemOne(
      { state: { log: sample(log) }, questions: QUESTIONS },
      REQUEST,
    );
    if (answers.isLog.noul < NOT_A_LOG_BELOW) {
      return { isLog: false, language: null };
    }
    return {
      isLog: answers.isLog.noul >= 0.5 ? true : null,
      language: pickLanguage(answers.language),
    };
  } catch (error) {
    console.warn("TypeSafe log check failed", error);
    return { isLog: null, language: null };
  }
}

/**
 * The start of a text, as Jev is shown it.
 *
 * @param log - The pasted text.
 * @returns Its first lines, blank ones dropped, cut to a few KB.
 * @example
 * logCheck.sample("Setup\n\nRed drew 7 cards for the opening hand.");
 * // "Setup\nRed drew 7 cards for the opening hand."
 */
export function sample(log: string): string {
  return log
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, SAMPLE_LINES)
    .join("\n")
    .slice(0, SAMPLE_CHARS);
}

function pickLanguage(answer: {
  choice: Language;
  confidence: number;
  probabilities: Record<Language, number>;
}): Language | null {
  if (answer.confidence >= MIN_LANGUAGE_CONFIDENCE) {
    return answer.choice;
  }
  const spanish = answer.probabilities.es + answer.probabilities["es-mx"];
  return spanish >= MIN_SPANISH ? "es" : null;
}
