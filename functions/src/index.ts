/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";

import createBot from "../../src/bot";
import commands from "../../src/commands/index";

import { createStore } from "./datastore";

// Ensure that all environment variables are defined
defineString("BOT_TOKEN");
defineString("OPENAI_KEY");
defineString("NODE_ENV");

async function createBotInstance() {
  const { BOT_TOKEN, NODE_ENV, FUNCTIONS_EMULATOR } = process.env;

  return createBot({
    token: BOT_TOKEN!,
    createStore,
    logger: FUNCTIONS_EMULATOR ? console.log : logger.info,
    isDev: NODE_ENV !== "production"
  });
}

export const check = onRequest({
  timeoutSeconds: 10,
  region: ["europe-west2"]
}, async (request, response) => {
  const { BOT_TOKEN } = process.env;
  if (BOT_TOKEN !== request.query.bot) {
    response.status(418).json({ error: "I'm a teabot!" });
    return;
  }

  const bot = await createBotInstance();
  response.status(200).json({
    env: process.env,
    bot: bot.botInfo,
    webhook: await bot.telegram.getWebhookInfo()
  });
});

export const start = onRequest({
  timeoutSeconds: 10,
  region: ["europe-west2"]
}, async (request, response) => {
  const { BOT_TOKEN } = process.env;
  if (BOT_TOKEN !== request.query.bot) {
    response.status(418).json({ error: "I'm a teabot!" });
    return;
  }

  const bot = await createBotInstance();
  const webhook = await bot.telegram.getWebhookInfo();
  if (webhook.url) {
    await bot.telegram.deleteWebhook();
  }

  await bot.createWebhook({
    domain: request.headers["x-forwarded-host"] as string ?? request.headers.host!,
    path: "/api/bot",
    secret_token: BOT_TOKEN!.replace(":", "-")
  });

  await bot.telegram.setMyCommands(
    commands
      .filter((cmd) => cmd.public)
      .map((cmd) => ({ command: cmd.name, description: cmd.description }))
  );

  response.status(200).json({
    success: true,
    bot: bot.botInfo,
    webhook: await bot.telegram.getWebhookInfo(),
  });
});

export const bot = onRequest({
  timeoutSeconds: 60 * 5,
  region: ["europe-west2"]
}, async (request, response) => {
  const { BOT_TOKEN } = process.env;
  let error;

  try {
    const bot = await createBotInstance();

    // Hook performs all security checks
    await bot.webhookCallback("/api/bot", { secretToken: BOT_TOKEN!.replace(":", "-") })(request, response);
  } catch (err) {
    logger.error(err);
    error = err;
  }

  if (!response.writableEnded) {
    const reply = error ? { error: (error as Error).message } : { success: true };

    logger.info(reply);
    response.status(200).json(reply);
  }
});
