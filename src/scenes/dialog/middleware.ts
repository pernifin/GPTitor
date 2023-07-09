import type { Message } from "typegram";
import d from "debug";

import { BotContext, BotUpdate } from "../../bot";
import config from "../../config";
import { ANTISPAM_SCENE_ID } from "../antispam";

const debug = d("bot:middleware");

const getUserId = (update: BotUpdate) => (update.callback_query || update.message).from.id;

export function antispam() {
  const requests: Record<number, number[]> = {};
  const byLastMinutes = (minutes: number) => (ts: number) => ts > Date.now() - 1000 * 60 * minutes;

  return async (ctx: BotContext, next: () => Promise<void>) => {
    const currentUserId = getUserId(ctx.update as BotUpdate);
    const { message, callback_query } = ctx.update as BotUpdate;

    if (!message && !callback_query?.data?.trim()) {
      return next();
    }

    if (ctx.scene.current?.id === ANTISPAM_SCENE_ID) {
      await next();
      if (!ctx.session.antispamPrompt) {
        requests[currentUserId] = [];
      }
      return;
    }

    requests[currentUserId] ??= [];
    requests[currentUserId].push(Date.now());
    requests[currentUserId] = requests[currentUserId].filter(byLastMinutes(60 * 24));

    debug("antispam %o", requests[currentUserId]);

    const { minute, hour, day } = config.antispam.requests;
    const exceed = requests[currentUserId].filter(byLastMinutes(1)).length > minute
      || requests[currentUserId].filter(byLastMinutes(60)).length > hour
      || requests[currentUserId].length > day;

    if (exceed) {
      return ctx.scene.enter(ANTISPAM_SCENE_ID);
    }

    return next();
  };
}

export function queue() {
  const promises = new Map<number, Promise<void>>();

  return async (ctx: BotContext, next: () => Promise<void>) => {
    const currentUserId = getUserId(ctx.update as BotUpdate);

    // Wait for any ongoing requests of the current user to finish
    while (promises.get(currentUserId)) {
      await promises.get(currentUserId);
    }

    // Make current request blocker for all subsequent
    const process = next();
    promises.set(currentUserId, process);

    // Process current request
    await process;

    // Cleanup
    promises.delete(currentUserId);
  };
}

export function shouldReact() {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    const msg = ctx.message as Message.TextMessage & Message.CaptionableMessage;
    if (msg.chat.type === "private") {
      return next();
    }

    const entities = msg.entities || msg.caption_entities || [];
    const text = msg.text || msg.caption || "";
    const isReplyToBot = msg.reply_to_message?.from?.username?.toLowerCase() === ctx.me.toLowerCase();
    const hasBotMention = entities.some(entity =>
      entity.type === "mention"
      && text.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === ctx.me.toLowerCase()
    );

    if (hasBotMention || isReplyToBot) {
      return next();
    }
  };
}