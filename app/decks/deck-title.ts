import { z } from "zod";

// What a deck may be called, when it's created and when it's renamed. Titles
// needn't be unique.
export const DECK_TITLE_MAX_LENGTH = 100;
export const DeckTitle = z.string().trim().min(1).max(DECK_TITLE_MAX_LENGTH);
// The same rule for the browser: a title of only spaces would trim to nothing.
export const DECK_TITLE_PATTERN = ".*\\S.*";
