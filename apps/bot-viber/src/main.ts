import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleWebhook } from "./handlers/index.js";

const PORT = Number(process.env.PORT ?? 3002);

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "bot-viber" }));
    return;
  }
  if (req.method === "POST" && req.url === "/webhook") {
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
  console.log(`bot-viber webhook server on :${PORT}`);
});
