import "dotenv/config";
import express from "express";
import d from "debug";
import { Telegraf } from "telegraf";

import Bot from "./bot";
import { createStore } from "./datastore";

const { BOT_TOKEN, NODE_ENV, PORT } = process.env;

const debug = d("bot:server");
const app = express();
const bot = new Bot(BOT_TOKEN!);

let webhook: ReturnType<typeof Telegraf.prototype.webhookCallback> | undefined;

app.use(async (request, response, next) => {
  if (
    request.headers["x-telegram-bot-api-secret-token"] === BOT_TOKEN?.replace(":", "-")
    || request.query.bot === BOT_TOKEN
  ) {
    return next();
  }

  response.status(418).json({ error: "I'm a teabot!" });
});

app.post("/bot", async (request, response, next) => {
  if (webhook) {
    return webhook(request, response, next);
  }
  response.status(500).json({ error: "Webhook is not set" });
});

app.get("/check", async (request, response) => {
  response.status(200).json({
    env: process.env,
    bot: await bot.telegram.getMe(),
    webhook: await bot.telegram.getWebhookInfo()
  });
});

app.get("/start", async (request, response) => {
  const { url } = await bot.telegram.getWebhookInfo();
  if (url) {
    await bot.telegram.deleteWebhook();
  }

  webhook = await bot.run({
    domain: request.headers["x-forwarded-host"] as string ?? request.headers.host!,
    createStore,
    logger: console.log,
    isDev: NODE_ENV !== "production"
  });

  response.status(200).json({
    success: true,
    bot: bot.botInfo,
    webhook: await bot.telegram.getWebhookInfo(),
  });
});

app.get("/stop", async (request, response) => {
  const { url } = await bot.telegram.getWebhookInfo();
  if (url) {
    await bot.telegram.deleteWebhook();
  }

  webhook = undefined;
  response.status(200).json({ success: true });
});

app.listen(PORT || 3000, () => {
  debug("Bot server started on port 3000");
});