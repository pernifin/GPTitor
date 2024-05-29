import d from "debug";
import { Markup } from "telegraf";
import actions from "../scenes/dialog/actions";
import { callUntil } from "../utils";

import { type Message } from "telegraf/types";
import type { BotContext } from "../bot";

const debug = d("bot:functions");

export type BotFunction = (ctx: BotContext, args: object) => Promise<string | void>;

export async function generateImage(ctx: BotContext, { prompt }: { prompt: string }) {
  try {
    debug(`generateImage: ${prompt}`);
    await callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => {
        const { url, revised_prompt } = await ctx.openai.generateImage(prompt);
        return ctx.sendPhoto(url!, {
          caption: revised_prompt,
          // ...Markup.inlineKeyboard([
          //   Markup.button.callback(ctx.$t("action.fullsize"), `fullsize:${url}`)
          // ])
        });
      }
    );
  } catch (error: any) {
    await ctx.sendMessage(error.message ?? ctx.$t("error.noimage"));
  }
}

export async function describeImage(ctx: BotContext) {
  const message = ctx.message as Message.PhotoMessage & Message.TextMessage;
  if (!message.photo) {
    return ctx.reply(ctx.$t("error.noimage"));
  }

  const link = await ctx.telegram.getFileLink(message.photo[0].file_id);
  const descriptions = await ctx.midjourney.describe(link.href);
  if (!descriptions) {
    return ctx.reply(ctx.$t("error.process-image-failed"));
  }

  return descriptions.map((text) => text.replace(/(--\w+ .*?)+$/, "")).join("\n\n");
}

export default {
  generateImage,
  describeImage
} as Record<string, BotFunction>;