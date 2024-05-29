import "dotenv/config";
import express from "express";
import d from "debug";

import Bot from "./bot";

const { BOT_TOKEN, NODE_ENV, PORT, RAILWAY_STATIC_URL } = process.env;

const debug = d("bot:server");
const app = express();
const bot = new Bot(BOT_TOKEN!);
const host = RAILWAY_STATIC_URL || process.argv[2];

if (!host) {
  throw new Error("Missing host. Provide '-- <host>' as the last argument");
}

app.post("/bot", async (request, response, next) => {
  response.status(200).json({ success: true });

  try {
    await bot.handle(request, response, next);
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}\nRequest: ${request.body}`, "utf-8");
  }
});

app.use((request, response, next) => {
  if (request.query.bot !== process.env.BOT_TOKEN) {
    return response.status(418).json({ error: "I'm a teabot!" });
  }
  next();
});

app.get("/check", async (request, response) => {
  response.status(200).json({
    env: process.env,
    memory: process.memoryUsage(),
    bot: await bot.telegram.getMe(),
    webhook: await bot.telegram.getWebhookInfo()
  });
});

app.listen(PORT || 3000, async () => {
  await bot.run({
    domain: host,
    path: "/bot",
    logger: console.log,
    isDev: NODE_ENV !== "production"
  });

  debug(`${bot.botInfo?.username} server started on port ${PORT || 3000}`);
});
