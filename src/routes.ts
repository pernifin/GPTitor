import * as fs from "fs";
import { Router } from "express";

import type Bot from "./bot";

export default function(bot: Bot) {
  const router = Router();

  router.use((request, response, next) => {
    if (request.query.bot !== process.env.BOT_TOKEN) {
      return response.status(418).json({ error: "I'm a teabot!" });
    }
    next();
  });

  router.get("/check", async (request, response) => {
    response.status(200).json({
      env: process.env,
      memory: process.memoryUsage(),
      bot: await bot.telegram.getMe(),
      webhook: await bot.telegram.getWebhookInfo()
    });
  });
  
  router.get("/debug", async (request, response) => {
    fs.createReadStream("./debug.log").pipe(response);
  });

  return router;
}
