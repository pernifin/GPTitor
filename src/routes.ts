import * as fs from "fs";
import * as path from "path";
import { writeHeapSnapshot } from "v8";
import { Router } from "express";
import d from "debug";

import type Bot from "./bot";

const debug = d("bot:routes");

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
  
  router.get("/make-snapshot", async (request, response) => {
    response.status(202).json({
      success: true,
      status: "Snapshot generation is about to start"
    }).end();
  
    debug("Prepare to dump heap snapshot");
    fs.mkdirSync("./snapshots", { recursive: true });
    
    const snapshot = writeHeapSnapshot(`./snapshots/${Date.now()}.heapsnapshot`);
    debug("Snapshot %s is ready", snapshot);
  });
  
  router.get("/get-snapshot", async (request, response) => {
    const snapshot = request.query.id ? `./snapshots/${request.query.id}.heapsnapshot` : undefined;
    if (snapshot) {
      const fileStream = fs.createReadStream(snapshot);
      response.setHeader("Content-Disposition", `attachment; filename="${path.basename(snapshot)}"`);
      response.setHeader("Content-Type", "application/octet-stream");
      fileStream.pipe(response);
    
      // fs.unlinkSync(snapshot);
    } else {
      return response.status(200).json({
        success: true,
        snapshots: fs.readdirSync("./snapshots")
      });
    }
  });

  return router;
}
