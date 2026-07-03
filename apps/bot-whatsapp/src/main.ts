import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleWebhook } from "./handlers/index.js";

const PORT = Number(process.env.PORT ?? 3003);
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "ilanhub";

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/webhook") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      res.writeHead(200);
      res.end(challenge);
      return;
    }
    res.writeHead(403);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "bot-whatsapp" }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/webhook") {
    const body = await readBody(req);
    await handleWebhook(JSON.parse(body));
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`bot-whatsapp webhook server on :${PORT}`);
});
