import { auth } from "@clerk/nextjs/server";
import type {
  Implementation,
  ServerContext,
} from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import * as archetypes from "@/lib/domain/archetypes";
import * as cards from "@/lib/domain/cards";
import * as decks from "@/lib/domain/decks";
import * as gameLog from "@/lib/domain/game-log";
import * as games from "@/lib/domain/games";

// Absolute and on our own origin, which is what the spec asks of an icon.
// No client renders a remote server's icon yet, so this is here for when
// they do.
const serverInfo: Implementation = {
  name: "rotom.gg",
  version: "1.0.0",
  icons: [
    {
      src: "https://rotom.gg/icon.png",
      mimeType: "image/png",
      sizes: ["224x224"],
    },
  ],
};

// Sent once when a client connects: what the data is and where it misleads,
// so every tool call starts from the same understanding.
const instructions = [
  "rotom.gg keeps a Pokémon TCG Live player's decks and the battle logs of " +
    "their games. A log is written from the side of the player who exported " +
    "it: their draws name cards, the opponent's don't.",
  "Read what a card does from the tools — get_game's playerCards and " +
    "opponentCards, get_archetype's list — never from memory, which is " +
    "wrong for anything printed recently. If a card's text isn't there, say " +
    "so and stop short of judging what it did; unknown text is not a blank " +
    "card. Basic Energy is the exception: it has no rules text, only the " +
    "one Energy of its type it provides, so it's left out on purpose.",
  "The exporting player's hand can be tracked: the log names their opening " +
    "hand, most of their draws and the prize cards they take, so what they " +
    "held on a turn can be rebuilt. The opponent's hand can't: their draws " +
    "go unnamed until a card is played or revealed. Mark anything about " +
    "the opponent's hidden cards as inference.",
  'Lines like "X put N damage counters on Y\'s Pokémon" can name the ' +
    "wrong player on either side. Work out who placed the counters and whose " +
    "Pokémon took them from the attack, ability or Tool that triggered it on " +
    "the lines before.",
  "When a search card such as Buddy-Buddy Poffin is followed only by a " +
    "shuffle, the log doesn't say whether it found nothing or found cards it " +
    "didn't name.",
  "The log has no turn numbers, prize counts or HP totals. Count them from " +
    "the turn headers, prize takes and damage lines, and show the count.",
  "A play is only better than the one made if it holds up against the " +
    "opponent's reply. Before recommending a line, play the opponent's next " +
    "turn against the board it leaves — their main attacks and abilities, " +
    "from get_archetype — and compare it with the board the player kept.",
  "The log records what the player did, never why. A non-play — an " +
    "evolution held in hand, a Pokémon left off the Bench, an attack " +
    "skipped — is often deliberate, protecting cards from what the " +
    "opponent's deck does. Find the best reason for a play before calling " +
    "it a mistake, and when the player can be asked, ask.",
].join("\n\n");

// The questions a game review should answer, in order. Written from what
// went wrong in real reviews: judging a card whose text was never looked up,
// and calling a deliberate hold a misplay without asking what the opponent's
// deck would have done to the alternative.
function reviewGame(gameId: string | undefined) {
  const which = gameId
    ? `game ${gameId} (get_game)`
    : "the most recent game (list_games with limit 1, then get_game)";
  return [
    `Review ${which}: was it winnable, and what should change next time?`,
    "",
    "1. Before judging any card, have the rules text of every Pokémon that " +
      "reached the board on both sides, and every Trainer that mattered. " +
      "Missing text is a reason to look further, not to treat the card as " +
      "doing nothing.",
    "2. Call get_archetype for the opponent's likely deck, and note what it " +
      "threatens: its main attacks and abilities, what they can target, and " +
      "what the player's cards protect against. This is the threat the " +
      "player was playing around.",
    "3. Rebuild the prize race turn by turn: whose turn, what was knocked " +
      "out, prizes left for each player.",
    "4. Find the two or three turns that decided the game, quoting the log " +
      "lines for each.",
    "5. For each, rebuild what the player held and had in play, and list the " +
      "alternatives. For every alternative, play out the opponent's next " +
      "turn against the board it leaves, and compare that with what " +
      "actually happened. An alternative that loses more to that reply is " +
      "not better, however good it looks on the player's turn.",
    "6. For every play or non-play you'd call a mistake, write the best " +
      "reason a strong player could have had for it. Then stop and ask the " +
      "player why they made those two or three decisions, and wait for the " +
      "answer before going on.",
    "7. Separate misplays from bad luck and from what couldn't be known; " +
      "the opponent's hand is only ever inference. Weigh every card's part " +
      "on both sides: a Pokémon can power a deck and still be the one that " +
      "gives up the last prizes.",
    "8. End with a verdict on whether it was winnable, a confidence that " +
      "reflects which of the opponent's replies were checked, and at most " +
      "three concrete changes to play or to the list.",
  ].join("\n");
}

// Every tool is read-only and scoped to the Clerk user the token belongs to.
// The user id comes from the verified token, never from a tool argument.
const READ_ONLY = { readOnlyHint: true, openWorldHint: false };

const deckSchema = z.object({
  id: z.number(),
  title: z.string(),
  wins: z.number(),
  losses: z.number(),
  winRate: z.number().nullable(),
});

const gameSchema = z.object({
  id: z.number(),
  deckId: z.number(),
  result: z.enum(["win", "loss"]).nullable(),
  wonCoinToss: z.boolean().nullable(),
  coinTossChoice: z.enum(["first", "second"]).nullable(),
  wentFirst: z.boolean().nullable(),
  turnCount: z.number().nullable(),
  opponentPokemon: z.array(z.string()).nullable(),
  maxDamage: z.number().nullable(),
  opponentMaxDamage: z.number().nullable(),
  playedAt: z.string(),
  // Null when the log showed too little to tell, which a short game often
  // does. Never a guess dressed up as a fact.
  opponentArchetype: z
    .object({
      name: z.string(),
      share: z.number().describe("Percent of recent tournament decks."),
      confidence: z.number().describe("0 to 1."),
      alternatives: z.array(
        z.object({ name: z.string(), confidence: z.number() }),
      ),
    })
    .nullable()
    .describe(
      "A guess from the Pokémon the opponent showed, not a fact. When " +
        "confidence is low, look in the log for the Pokémon that set an " +
        "alternative apart before settling on one.",
    ),
});

function toDeck(deck: decks.DeckWithRecord) {
  return {
    id: deck.id,
    title: deck.title,
    wins: deck.wins,
    losses: deck.losses,
    winRate: decks.findWinRate(deck) ?? null,
  };
}

// The raw log is deliberately left out: one is hundreds of lines, so a deck's
// worth of them would crowd out everything else in the client's context.
function toGame(game: games.Game, format: archetypes.Archetype[]) {
  const match = archetypes.findMatch(game.opponentPokemon ?? [], format);
  return {
    id: game.id,
    deckId: game.deckId,
    result: game.result,
    wonCoinToss: game.wonCoinToss,
    coinTossChoice: game.coinTossChoice,
    wentFirst: game.wentFirst,
    turnCount: game.turnCount,
    opponentPokemon: game.opponentPokemon,
    maxDamage: game.maxDamage,
    opponentMaxDamage: game.opponentMaxDamage,
    playedAt: game.createdAt.toISOString(),
    opponentArchetype: match
      ? {
          name: match.name,
          share: match.share,
          confidence: match.confidence,
          alternatives: match.alternatives.map(({ name, confidence }) => ({
            name,
            confidence,
          })),
        }
      : null,
  };
}

// The Clerk user id the token was issued for. Tools take no user argument,
// so this is the only way a request names whose games it reads.
function getUserId(context: ServerContext): string {
  const userId = context.http?.authInfo?.extra?.userId;
  if (typeof userId !== "string") {
    throw new Error("No authenticated Clerk user on the request");
  }
  return userId;
}

// Both shapes, because clients differ in which one they read.
function result<T>(structuredContent: T) {
  return {
    structuredContent,
    content: [
      { type: "text" as const, text: JSON.stringify(structuredContent) },
    ],
  };
}

// What one version of a card does. Every field is optional: basic Energy has
// none of it, and a Trainer only has type and effect.
const printingSchema = z.object({
  type: z
    .string()
    .nullable()
    .optional()
    .describe("Supporter, Item, Stadium, Tool; Basic, Stage1, Stage2."),
  hp: z.number().optional(),
  retreat: z.number().optional(),
  types: z.array(z.string()).optional(),
  weakness: z.array(z.string()).optional(),
  evolveFrom: z.string().optional(),
  attacks: z
    .array(
      z.object({
        name: z.string(),
        cost: z.array(z.string()),
        damage: z.string().nullable(),
        effect: z.string().nullable(),
      }),
    )
    .optional(),
  abilities: z
    .array(z.object({ name: z.string(), effect: z.string().nullable() }))
    .optional(),
  effect: z
    .string()
    .optional()
    .describe("The rules text of a Trainer or Special Energy."),
  tera: z
    .literal(true)
    .optional()
    .describe(
      "A Tera Pokémon: attacks do it no damage while it's on the Bench, and " +
        "effects that name Tera Pokémon apply to it.",
    ),
});

const cardSchema = printingSchema.extend({
  name: z.string(),
  set: z.string().describe('Set code, e.g. "PBL".'),
  number: z.string().describe("Collector number within the set."),
  pct: z.number().describe("Percent of lists running it."),
  typical: z.number().describe("The usual number of copies."),
});

// A log names a card without saying which printing was played, so every
// version of it comes along. Most names have just one.
const logCardSchema = z.object({
  name: z.string(),
  category: z.enum(["pokemon", "trainer", "energy"]),
  printings: z.array(printingSchema),
});

// What the cards a player showed in a log do. Names outside the format, basic
// Energy among them, have no text and are left out.
function toLogCards(names: gameLog.Cards) {
  return cards
    .listCards([...names.pokemon, ...names.trainers, ...names.energy])
    .map((card) => ({
      ...card,
      printings: card.printings.map((printing) => ({
        ...printing,
        prints: undefined,
      })),
    }));
}

// The text of the exact printing the lists run, since reprints can differ.
function toCard(card: archetypes.Archetype["cards"][number]) {
  const printing = cards.findPrinting(card.name, card.set, card.number);
  if (!printing) {
    return card;
  }
  // Where else it was printed is noise to a reader; undefined keeps it out of
  // the JSON.
  return { ...card, ...printing, prints: undefined };
}

const handler = createMcpHandler(
  (server) => {
    server.registerPrompt(
      "review_game",
      {
        title: "Review a game",
        description:
          "Walk through one game turn by turn: prize race, deciding turns, " +
          "misplays against bad luck, and whether it was winnable.",
        argsSchema: z.object({
          gameId: z
            .string()
            .optional()
            .describe("A game id from list_games. Omit for the latest game."),
        }),
      },
      ({ gameId }) => ({
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: reviewGame(gameId) },
          },
        ],
      }),
    );

    server.registerTool(
      "list_decks",
      {
        title: "List decks",
        description:
          "Lists the signed-in player's decks with their win–loss record. " +
          "Start here to see what the player plays; list_games can also " +
          "go straight to games across every deck.",
        inputSchema: z.object({}),
        outputSchema: z.object({ decks: z.array(deckSchema) }),
        annotations: READ_ONLY,
      },
      async (_input, context) => {
        const userId = getUserId(context);
        const owned = await decks.listDecks(userId);
        return result({ decks: owned.map(toDeck) });
      },
    );

    server.registerTool(
      "list_games",
      {
        title: "List games",
        description:
          "Lists the player's games, newest first, summarized: result, coin " +
          "toss, turn order, turn count, the opponent's Pokémon, the biggest " +
          "hit each player landed, and which deck the opponent was most " +
          "likely playing. Leave out deckId for games across every deck — " +
          "with limit 1, that's the most recent game. Use it to look for " +
          "patterns across games. Returns nothing for a deck the player " +
          "doesn't own.",
        inputSchema: z.object({
          deckId: z
            .number()
            .optional()
            .describe("A deck id from list_decks. Omit for every deck."),
          limit: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("Return at most this many of the newest games."),
        }),
        outputSchema: z.object({ games: z.array(gameSchema) }),
        annotations: READ_ONLY,
      },
      async ({ deckId, limit }, context) => {
        const userId = getUserId(context);
        const [played, format] = await Promise.all([
          games.listGames({ userId, deckId, limit }),
          archetypes.listArchetypes(),
        ]);
        return result({ games: played.map((game) => toGame(game, format)) });
      },
    );

    server.registerTool(
      "get_archetype",
      {
        title: "Get a deck archetype's typical list",
        description:
          "What a named deck archetype usually plays, from recent tournament " +
          "decklists: every card in at least a tenth of them, with the exact " +
          "printing, how often it's run, how many copies, and what that " +
          "printing does — HP, attacks, abilities, Trainer text. Works for " +
          "any archetype: the opponent's, to judge what they were likely " +
          "holding — whether that build runs Rare Candy, how many lists play " +
          "Unfair Stamp — or one close to the player's own deck. A card " +
          "missing from the list may still be in a given deck: techs under " +
          "a tenth of lists are left out, so treat absence as unlikely, not " +
          "impossible.",
        inputSchema: z.object({
          name: z
            .string()
            .describe(
              "An archetype name, as opponentArchetype gives it, e.g. " +
                '"Dragapult Dusknoir".',
            ),
        }),
        outputSchema: z.object({
          archetype: z
            .object({
              name: z.string(),
              share: z.number().describe("Percent of recent tournament decks."),
              lists: z.number().describe("Decklists this was taken from."),
              cards: z.array(cardSchema),
            })
            .nullable(),
          // Named so a miss can be retried rather than guessed at.
          suggestions: z
            .array(z.string())
            .describe(
              "Only when archetype is null: known names to retry with, " +
                "closest first. Empty on a match.",
            ),
        }),
        annotations: READ_ONLY,
      },
      async ({ name }) => {
        const found = await archetypes.findArchetypeByName(name);
        if (found) {
          return result({
            archetype: {
              name: found.name,
              share: found.share,
              lists: found.lists,
              cards: found.cards.map(toCard),
            },
            suggestions: [],
          });
        }

        const known = await archetypes.listArchetypeNames();
        const needle = name.toLowerCase();
        const close = known
          .filter((entry) => entry.name.toLowerCase().includes(needle))
          .map((entry) => entry.name);
        return result({
          archetype: null,
          suggestions: (close.length > 0
            ? close
            : known.map((entry) => entry.name)
          ).slice(0, 8),
        });
      },
    );

    server.registerTool(
      "get_game",
      {
        title: "Get one game's battle log",
        description:
          "Returns a single game with its full Pokémon TCG Live battle log, " +
          "for reading a match turn by turn, and what every card each player " +
          "showed in it does — HP, attacks, abilities, Trainer text — so a " +
          "card's effect is read, not inferred from the log. The log is " +
          "long, so fetch one game at a time rather than looping over a deck.",
        inputSchema: z.object({
          gameId: z.number().describe("A game id from list_games."),
        }),
        outputSchema: z.object({
          game: gameSchema
            .extend({
              log: z.string(),
              playerCards: z
                .array(logCardSchema)
                .describe("Cards the player who exported the log showed."),
              opponentCards: z
                .array(logCardSchema)
                .describe("Cards the opponent showed."),
            })
            .nullable(),
        }),
        annotations: READ_ONLY,
      },
      async ({ gameId }, context) => {
        const userId = getUserId(context);
        const [game, format] = await Promise.all([
          games.findGame({ userId, gameId }),
          archetypes.listArchetypes(),
        ]);
        return result({
          game: game
            ? {
                ...toGame(game, format),
                log: game.log,
                playerCards: toLogCards(gameLog.getViewerCards(game.log)),
                opponentCards: toLogCards(gameLog.getOpponentCards(game.log)),
              }
            : null,
        });
      },
    );
  },
  { serverInfo, instructions },
);

// Clerk issues the OAuth token; auth() validates it and tells us whose it is.
const authHandler = withMcpAuth(
  handler,
  async (_request, token) => {
    if (!token) {
      return undefined;
    }

    const clerk = await auth({ acceptsToken: "oauth_token" });
    if (!clerk.isAuthenticated) {
      return undefined;
    }

    return {
      token,
      clientId: clerk.clientId,
      scopes: clerk.scopes,
      extra: { userId: clerk.userId },
    };
  },
  // No requiredScopes yet: a token that resolves to a Clerk user is the gate,
  // and every query is scoped to that user. Tighten once we've seen which
  // scopes Clerk actually puts on a connector's token.
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  },
);

export { authHandler as GET, authHandler as POST };
