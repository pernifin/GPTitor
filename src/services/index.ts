import Bot, { type BotContext } from "../bot";
import config from "../config";

import OpenAI from "./OpenAI";
import Quota from "./Quota";
import Settings from "./Settings";

export { default as OpenAI } from "./OpenAI";
export { default as Quota, type UserQuota } from "./Quota";
export { default as Settings, type ChatSettings } from "./Settings";
export { default as Conversation } from "./Conversation";
export { default as Midjourney } from "./Midjourney";
export { default as Translation } from "./Translation";

export function services(bot: Bot) {
  const { OPENAI_KEY } = process.env;

  return async (ctx: BotContext, next: () => Promise<void>) => {
    const { translation, conversation, ffmpeg, midjourney } = bot.services!;

    ctx.openai = new OpenAI(OPENAI_KEY!, ctx);
    ctx.conversation = conversation;
    ctx.ffmpeg = ffmpeg;
    ctx.midjourney = midjourney;

    ctx.quota = new Quota(ctx.session);
    ctx.settings = new Settings(ctx.session);
    ctx.timestamp = Date.now();
    ctx.$t = translation.get(
      translation.hasSupport(ctx.from?.language_code!) 
        ? ctx.from?.language_code!
        : config.langs.default
    );

    return next();
  }
}