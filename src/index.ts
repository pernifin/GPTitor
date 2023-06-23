import "dotenv/config";
import express from "express";
import d from "debug";

import Bot from "./bot";
import { createStore } from "./datastore";

const { BOT_TOKEN, NODE_ENV, PORT, RAILWAY_STATIC_URL } = process.env;

const debug = d("bot:server");
const app = express();
const bot = new Bot(BOT_TOKEN!);
const host = RAILWAY_STATIC_URL || process.argv[2];

app.post("/bot", (request, response, next) => {
  const timeout = setTimeout(
    () => !response.writableEnded && response.status(200).json({ success: true }),
    50000
  );

  bot.handle(request, response, () => {
    clearTimeout(timeout);
    next();
  });
});

app.get("/check", async (request, response) => {
  if (request.query.bot !== BOT_TOKEN) {
    return response.status(418).json({ error: "I'm a teabot!" });
  }

  response.status(200).json({
    env: process.env,
    bot: await bot.telegram.getMe(),
    webhook: await bot.telegram.getWebhookInfo()
  });
});

app.listen(PORT || 3000, async () => {
  await bot.run({
    domain: host,
    path: "/bot",
    createStore,
    logger: console.log,
    isDev: NODE_ENV !== "production"
  });

  debug("Bot server started on port 3000");
});