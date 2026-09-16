import { auth } from "@clerk/nextjs/server";
import type {
  Implementation,
  ServerContext,
} from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import * as decks from "@/lib/domain/decks";
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
  result: z.enum(["win", "loss"]).nullable(),
  wonCoinToss: z.boolean().nullable(),
  coinTossChoice: z.enum(["first", "second"]).nullable(),
  wentFirst: z.boolean().nullable(),
  turnCount: z.number().nullable(),
  opponentPokemon: z.array(z.string()).nullable(),
  maxDamage: z.number().nullable(),
  opponentMaxDamage: z.number().nullable(),
  playedAt: z.string(),
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
function toGame(game: games.Game) {
  return {
    id: game.id,
    result: game.result,
    wonCoinToss: game.wonCoinToss,
    coinTossChoice: game.coinTossChoice,
    wentFirst: game.wentFirst,
    turnCount: game.turnCount,
    opponentPokemon: game.opponentPokemon,
    maxDamage: game.maxDamage,
    opponentMaxDamage: game.opponentMaxDamage,
    playedAt: game.createdAt.toISOString(),
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

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_decks",
      {
        title: "List decks",
        description:
          "Lists the signed-in player's decks with their win–loss record. " +
          "Start here: every other tool needs a deck id from this list.",
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
        title: "List games on a deck",
        description:
          "Lists the games played with one deck, newest first, summarized: " +
          "result, coin toss, turn order, turn count, the opponent's Pokémon " +
          "and the biggest hit each player landed. Use it to look for " +
          "patterns across games. Returns nothing for a deck the player " +
          "doesn't own.",
        inputSchema: z.object({
          deckId: z.number().describe("A deck id from list_decks."),
        }),
        outputSchema: z.object({ games: z.array(gameSchema) }),
        annotations: READ_ONLY,
      },
      async ({ deckId }, context) => {
        const userId = getUserId(context);
        const played = await games.listGames({ userId, deckId });
        return result({ games: played.map(toGame) });
      },
    );

    server.registerTool(
      "get_game",
      {
        title: "Get one game's battle log",
        description:
          "Returns a single game with its full Pokémon TCG Live battle log, " +
          "for reading a match turn by turn. The log is long, so fetch one " +
          "game at a time rather than looping over a deck.",
        inputSchema: z.object({
          gameId: z.number().describe("A game id from list_games."),
        }),
        outputSchema: z.object({
          game: gameSchema.extend({ log: z.string() }).nullable(),
        }),
        annotations: READ_ONLY,
      },
      async ({ gameId }, context) => {
        const userId = getUserId(context);
        const game = await games.findGame({ userId, gameId });
        return result({
          game: game ? { ...toGame(game), log: game.log } : null,
        });
      },
    );
  },
  { serverInfo },
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
