import { loadMonorepoEnv } from "@ilanhub/shared/load-env";
loadMonorepoEnv();

import { Bot, webhookCallback } from "grammy";
import { createServer } from "node:http";
import { registerHandlers } from "./handlers/index.js";

const PORT = Number(process.env.PORT ?? 3001);
const API_URL = process.env.API_URL ?? "http://localhost:3010";
const BOT_SECRET = process.env.BOT_INTERNAL_SECRET ?? "dev-bot-secret";
const TOKEN_RETRIES = Number(process.env.BOT_TOKEN_RETRIES ?? 15);
const TOKEN_RETRY_MS = Number(process.env.BOT_TOKEN_RETRY_MS ?? 2000);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type TokenFetchResult =
  | { ok: true; token: string; source: "api" }
  | { ok: false; reason: string };

async function fetchTokenFromApi(): Promise<TokenFetchResult> {
  const url = `${API_URL}/api/bots/telegram/config`;
  try {
    const res = await fetch(url, {
      headers: { "x-bot-secret": BOT_SECRET },
    });
    const raw = await res.text();
    let data: { botToken?: string | null };
    try {
      data = JSON.parse(raw) as { botToken?: string | null };
    } catch {
      return {
        ok: false,
        reason: `GET ${url} returned non-JSON (${res.status}): ${raw.slice(0, 120)}`,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: `GET ${url} failed (${res.status}): ${raw.slice(0, 120)}`,
      };
    }
    const token = data.botToken?.trim();
    if (token) return { ok: true, token, source: "api" };
    return {
      ok: false,
      reason: "API has no telegram botToken — save token in admin /telegram",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Cannot reach API at ${url}: ${msg}` };
  }
}

async function resolveToken(options?: {
  allowEnvFallback?: boolean;
  retries?: number;
  required?: boolean;
}): Promise<string | null> {
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const retries = options?.retries ?? TOKEN_RETRIES;
  const attempts: string[] = [];

  for (let i = 1; i <= retries; i++) {
    const result = await fetchTokenFromApi();
    if (result.ok) {
      if (i > 1) {
        console.log(`bot-telegram: token loaded from API (attempt ${i}/${retries})`);
      }
      return result.token;
    }
    attempts.push(`  ${i}/${retries}: ${result.reason}`);
    if (i < retries) {
      console.warn(`bot-telegram: ${result.reason}; retry in ${TOKEN_RETRY_MS}ms`);
      await sleep(TOKEN_RETRY_MS);
    }
  }

  if (options?.allowEnvFallback !== false && envToken) {
    console.warn("bot-telegram: falling back to TELEGRAM_BOT_TOKEN env");
    return envToken;
  }

  if (options?.required === false) {
    console.warn(
      "bot-telegram: no token yet — waiting for admin panel save (/reload)",
    );
    return null;
  }

  throw new Error(
    [
      "TELEGRAM_BOT_TOKEN is required (admin panel or .env).",
      `API_URL=${API_URL}`,
      "Attempts:",
      ...attempts,
    ].join("\n"),
  );
}

let currentToken: string | null = null;
let bot: Bot | null = null;
// grammy webhookCallback overload is wide; keep runtime handler only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let handleUpdate: ((req: any, res: any) => Promise<void>) | null = null;

function applyToken(token: string) {
  currentToken = token;
  bot = new Bot(token);
  registerHandlers(bot);
  handleUpdate = webhookCallback(bot, "http") as (req: any, res: any) => Promise<void>;
}

async function reloadToken(): Promise<{
  changed: boolean;
  ready: boolean;
  tokenSource: string;
}> {
  const next = await resolveToken({
    allowEnvFallback: true,
    retries: 3,
    required: false,
  });
  if (!next) {
    return { changed: false, ready: false, tokenSource: "none" };
  }
  if (next === currentToken && bot) {
    return { changed: false, ready: true, tokenSource: "unchanged" };
  }
  applyToken(next);
  console.log("bot-telegram: token loaded from admin API");
  return { changed: true, ready: true, tokenSource: "api-or-env" };
}

const initial = await resolveToken({
  allowEnvFallback: true,
  retries: 5,
  required: false,
});
if (initial) applyToken(initial);

const WEBHOOK_PATHS = new Set(["/webhook", "/webhooks/telegram"]);

const server = createServer(async (req, res) => {
  const path = req.url?.split("?")[0] ?? "";

  if (req.method === "GET" && path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "bot-telegram",
        ready: Boolean(bot),
      }),
    );
    return;
  }

  if (req.method === "POST" && path === "/reload") {
    const secret = req.headers["x-bot-secret"];
    if (secret !== BOT_SECRET) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }
    try {
      const result = await reloadToken();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: msg }));
    }
    return;
  }

  if (req.method === "POST" && WEBHOOK_PATHS.has(path)) {
    if (!handleUpdate) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bot token not configured" }));
      return;
    }
    try {
      await handleUpdate(req, res);
    } catch (err) {
      console.error("bot webhook error:", err);
      if (!res.headersSent) {
        res.writeHead(200);
        res.end();
      }
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(
    `bot-telegram webhook server on :${PORT} (token ${bot ? "ready" : "pending admin"})`,
  );
});

// Poll admin API periodically until token appears
if (!bot) {
  void (async () => {
    while (!bot) {
      await sleep(10_000);
      try {
        await reloadToken();
      } catch {
        /* keep waiting */
      }
    }
  })();
}
