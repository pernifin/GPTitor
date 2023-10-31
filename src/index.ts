import "dotenv/config";
import * as fs from "fs";
import express from "express";
import { type AxiosError } from 'axios';
import d from "debug";

import Bot from "./bot";
import routes from "./routes";

const { BOT_TOKEN, NODE_ENV, PORT, RAILWAY_STATIC_URL } = process.env;

const debug = d("bot:server");
const app = express();
const bot = new Bot(BOT_TOKEN!);
const host = RAILWAY_STATIC_URL || process.argv[2];
const log = fs.createWriteStream("./debug.log", { flags: "a" });

if (!host) {
  throw new Error("Missing host. Provide '-- <host>' as the last argument");
}

app.post("/bot", async (request, response, next) => {
  response.status(200).json({ success: true });

  try {
    await bot.handle(request, response, next);
  } catch (error) {
    debug(
      "Error handle update: %s\n%s\n\n%o\n\n%o",
      (error as Error).message,
      (error as Error).stack,
      request.body,
      (error as AxiosError).response?.data
    );
    log.write(`Error: ${JSON.stringify(error, null, 2)}\nRequest: ${request.body}`, "utf-8");
  }
});

app.get("/file/:file.png", async (request, response) => {
  const file = await bot.telegram.getFileLink(request.params.file);
  const buffer = await fetch(file.href).then((result) => result.arrayBuffer());

  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  response.setHeader('Content-Type', 'image/png');
  response.setHeader('Content-Length', buffer.byteLength);
  response.send(Buffer.from(buffer));
});

app.use(routes(bot));

app.listen(PORT || 3000, async () => {
  await bot.run({
    domain: host,
    path: "/bot",
    logger: console.log,
    isDev: NODE_ENV !== "production"
  });

  debug(`${bot.botInfo?.username} server started on port ${PORT || 3000}`);
});
