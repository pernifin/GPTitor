import Bot, { type BotContext } from "../bot";
import config from "../config";

import Datastore from "./Datastore";
import OpenAI from "./OpenAI";
import Quota from "./Quota";
import Settings from "./Settings";
import Midjourney from "./Midjourney";
import { type LangName } from "./Translation";

export { default as Datastore } from "./Datastore";
export { default as OpenAI } from "./OpenAI";
export { default as Quota, type UserQuota } from "./Quota";
export { default as Settings, type ChatSettings } from "./Settings";
export { default as Conversation } from "./Conversation";
export { default as Midjourney, type Generation, type GeneratedImage } from "./Midjourney";
export { default as Translation, type Translator, type LangName } from "./Translation";

export function services(bot: Bot) {
  const { OPENAI_KEY } = process.env;

  return async (ctx: BotContext, next: () => Promise<void>) => {
    const { translation, conversation, ffmpeg } = bot.services!;

    ctx.openai = new OpenAI(OPENAI_KEY!, ctx);
    ctx.conversation = conversation;
    ctx.ffmpeg = ffmpeg;
    ctx.midjourney = new Midjourney(ctx, new Datastore("generations"));

    ctx.quota = new Quota(ctx.session);
    ctx.settings = new Settings(ctx.session);
    ctx.timestamp = Date.now();
    ctx.host = bot.host!;
    ctx.$t = translation.getTranslator(ctx.from?.language_code as LangName || config.defaultLang);

    await next();
  }
}