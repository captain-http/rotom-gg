/**
 * What TypeSafe's Jev model reads from a pasted battle log: whether it is
 * one, and which language Pokémon TCG Live wrote it in. The parser only
 * knows English sentences; Jev reads any of the game's languages.
 *
 * Jev names the language; which Spanish it is, the log itself says.
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
      es: "Spanish, of either Spain or Latin America",
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
    const language = pickLanguage(answers.language);
    return {
      isLog: answers.isLog.noul >= 0.5 ? true : null,
      language: language === "es" ? findSpanish(log) : language,
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

/**
 * Which Spanish a log is in, from wording only these two differ on.
 *
 * Spain's client writes the perfect tense and "su baraja", and calls the
 * cards "del Team Rocket"; Latin America's writes the simple past and "su
 * mazo", and calls them "del Equipo Rocket". A question to Jev can't split
 * them reliably, but counting these can.
 *
 * @param log - The raw battle log, in Spanish.
 * @returns "es" for Spain, "es-mx" for Latin America, or null when the log
 *   shows neither.
 * @example
 * logCheck.findSpanish("http_party ha robado una carta."); // "es"
 */
export function findSpanish(log: string): "es" | "es-mx" | null {
  // \b is ASCII-only, and "robó" ends outside it, so bound on letters.
  const spain = count(log, [
    /(?<!\p{L})ha robado(?!\p{L})/gu,
    /(?<!\p{L})su baraja(?!\p{L})/gu,
    /(?<!\p{L})del Team Rocket(?!\p{L})/gu,
  ]);
  const latin = count(log, [
    /(?<!\p{L})robó(?!\p{L})/gu,
    /(?<!\p{L})su mazo(?!\p{L})/gu,
    /(?<!\p{L})del Equipo Rocket(?!\p{L})/gu,
  ]);
  if (spain === latin) {
    return null;
  }
  return spain > latin ? "es" : "es-mx";
}

function count(log: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (total, pattern) => total + (log.match(pattern)?.length ?? 0),
    0,
  );
}

function pickLanguage(answer: {
  choice: Language;
  confidence: number;
}): Language | null {
  return answer.confidence >= MIN_LANGUAGE_CONFIDENCE ? answer.choice : null;
}
