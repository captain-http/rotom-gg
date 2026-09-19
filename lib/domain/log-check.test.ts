import { type Fetch, TypeSafeClient } from "@typesafe-ai/sdk";
import { expect, test, vi } from "vitest";
import * as logCheck from "./log-check";

// A client whose every request gets this answer, without a network call.
function answering(answers: object, status = 200) {
  const fetch = vi.fn<Fetch>(
    async () =>
      new Response(
        JSON.stringify({ model: "jev-latest", answers, usage: {} }),
        {
          status,
          headers: { "content-type": "application/json" },
        },
      ),
  );
  const client = new TypeSafeClient({
    apiKey: "test",
    fetch,
    retry: { maxRetries: 0 },
    logLevel: "off",
  });
  return { client, fetch };
}

function languageAnswer(probabilities: Record<string, number>) {
  const [top] = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  return {
    type: "choice",
    choice: top![0],
    confidence: top![1],
    probabilities,
  };
}

test("check reads a log and its language", async () => {
  const { client } = answering({
    isLog: { type: "noul", noul: 0.98 },
    language: languageAnswer({ en: 0.95, fr: 0.05 }),
  });

  expect(await logCheck.check("Setup", client)).toEqual({
    isLog: true,
    language: "en",
  });
});

test("check asks both questions in one request, about the log's start", async () => {
  const { client, fetch } = answering({
    isLog: { type: "noul", noul: 0.98 },
    language: languageAnswer({ en: 1 }),
  });
  const log = Array.from({ length: 100 }, (_, i) => `Line ${i}`).join("\n");

  await logCheck.check(log, client);

  expect(fetch).toHaveBeenCalledTimes(1);
  const body = JSON.parse(fetch.mock.calls[0]![1]!.body as string);
  expect(Object.keys(body.questions)).toEqual(["isLog", "language"]);
  expect(body.state).toEqual({ log: logCheck.sample(log) });
});

test("check refuses only a clear no", async () => {
  const unsure = answering({
    isLog: { type: "noul", noul: 0.3 },
    language: languageAnswer({ en: 0.9 }),
  });
  const no = answering({
    isLog: { type: "noul", noul: 0.02 },
    language: languageAnswer({ en: 0.9 }),
  });

  expect(await logCheck.check("Turn 1", unsure.client)).toEqual({
    isLog: null,
    language: "en",
  });
  expect(await logCheck.check("Milk, eggs", no.client)).toEqual({
    isLog: false,
    language: null,
  });
});

test("check leaves an unsure language null", async () => {
  const { client } = answering({
    isLog: { type: "noul", noul: 0.98 },
    language: languageAnswer({ fr: 0.4, it: 0.35, en: 0.25 }),
  });

  expect(await logCheck.check("Setup", client)).toMatchObject({
    language: null,
  });
});

test("check reads which Spanish from the log, not from Jev", async () => {
  const { client } = answering({
    isLog: { type: "noul", noul: 0.98 },
    language: languageAnswer({ es: 0.95, pt: 0.05 }),
  });

  expect(
    await logCheck.check(
      "http_party robó 7 cartas de la mano inicial.",
      client,
    ),
  ).toMatchObject({ language: "es-mx" });
});

test("findSpanish tells Spain's Spanish from Latin America's", () => {
  expect(
    logCheck.findSpanish(
      "Janta_Abi ha robado una carta.\n- ha barajado su baraja.",
    ),
  ).toBe("es");
  expect(
    logCheck.findSpanish("http_party robó una carta.\n- barajó su mazo."),
  ).toBe("es-mx");
  expect(
    logCheck.findSpanish("http_party puso en juego a Budew en la Banca."),
  ).toBeNull();
});

test("findSpanish reads the Rocket cards' name", () => {
  expect(logCheck.findSpanish("Mimikyu del Team Rocket")).toBe("es");
  expect(logCheck.findSpanish("Mimikyu del Equipo Rocket")).toBe("es-mx");
});

test("check can't tell when TypeSafe fails", async () => {
  const { client } = answering({ detail: "Overloaded" }, 529);
  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(await logCheck.check("Setup", client)).toEqual({
    isLog: null,
    language: null,
  });
});

test("sample keeps the first lines, without blanks", () => {
  expect(logCheck.sample("Setup\n\n  \nRed drew 7 cards.\r\nTurn")).toBe(
    "Setup\nRed drew 7 cards.\nTurn",
  );
  const long = Array.from({ length: 100 }, (_, i) => `Line ${i}`).join("\n");
  expect(logCheck.sample(long).split("\n")).toHaveLength(60);
  expect(logCheck.sample("x".repeat(10_000))).toHaveLength(6000);
});
