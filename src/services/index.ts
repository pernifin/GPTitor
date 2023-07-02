import Bot, { type BotContext } from "../bot";
import config from "../config";

import OpenAI from "./OpenAI";
import Quota from "./Quota";
import Settings from "./Settings";
import Midjourney from "./Midjourney";

export { default as OpenAI } from "./OpenAI";
export { default as Quota, type UserQuota } from "./Quota";
export { default as Settings, type ChatSettings } from "./Settings";
export { default as Conversation } from "./Conversation";
export { default as Midjourney, type Generation, type GeneratedImage } from "./Midjourney";
export { default as Translation } from "./Translation";

export function services(bot: Bot) {
  const { OPENAI_KEY, DISCORD_SERVER_ID, DISCORD_CHANNEL_ID, DISCORD_SALAI_TOKEN } = process.env;

  return async (ctx: BotContext, next: () => Promise<void>) => {
    const { translation, conversation, ffmpeg } = bot.services!;

    ctx.openai = new OpenAI(OPENAI_KEY!, ctx);
    ctx.conversation = conversation;
    ctx.ffmpeg = ffmpeg;
    ctx.midjourney = new Midjourney({
      ServerId: DISCORD_SERVER_ID!,
      ChannelId: DISCORD_CHANNEL_ID!,
      SalaiToken: DISCORD_SALAI_TOKEN!,
      Debug: true
    }, ctx);

    ctx.quota = new Quota(ctx.session);
    ctx.settings = new Settings(ctx.session);
    ctx.timestamp = Date.now();
    ctx.$t = translation.get(
      translation.hasSupport(ctx.from?.language_code!) 
        ? ctx.from?.language_code!
        : config.langs.default
    );

    await ctx.midjourney.init();
    await next();
    ctx.midjourney.close();
  }
}