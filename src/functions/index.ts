import { type Message } from "typegram";

import type { BotContext } from "../bot";
import actions from "../scenes/dialog/actions";

export type BotFunction = (ctx: BotContext, args: object) => Promise<string | void>;

export async function generateImage(ctx: BotContext, { prompt }: { prompt: string }) {
  const hasNonAscii = prompt.split("").some((char) => char.charCodeAt(0) > 127)
  if (hasNonAscii) {
    prompt = await ctx.openai.translateMessage(prompt);
  }

  await actions.generate(ctx, prompt);
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