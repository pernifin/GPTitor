import type { Message } from "typegram";

import Conversation from '../services/Conversation';

import type { BotContext } from "../bot";

export default async function(ctx: BotContext) {
  const msg = ctx.message as Message.TextMessage;
  const prompt = Conversation.getCleanMessage(msg.text!);
  if (!prompt) {
    return;
  }

  const image = await ctx.openai.createImage(ctx, prompt);
  return ctx.sendPhoto(image.url!);
}