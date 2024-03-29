import type { Message } from "typegram";
import { type ChatCompletionRequestMessage } from "openai";
import d from "debug";

import { type BotContext } from "../../bot";
import functions from "../../functions";
import { format, callUntil } from "../../utils";

const debug = d("bot:dialog");

export async function onPhoto(ctx: BotContext, next: () => Promise<void>) {
  const message = ctx.message as Message.PhotoMessage & Message.TextMessage;

  message.photo = message.photo.sort((photoA, photoB) => photoB.file_size! - photoA.file_size!).slice(0, 0);
  message.text = message.caption ?? "";

  return next();
}

export async function onVoice(ctx: BotContext, next: () => Promise<void>) {
  await callUntil(
    () => ctx.sendChatAction("typing"),
    async () => {
      const msg = ctx.message as Message.VoiceMessage & Message.TextMessage;
      const url = await ctx.telegram.getFileLink(msg.voice.file_id);
      const chunks: Buffer[] = [];

      return new Promise((resolve) => {
        ctx.ffmpeg(url.href)
          .toFormat("mp3")
          .pipe()
          .on("data", (chunk: Buffer) => chunks.push(chunk))
          .on("end", async () => {
            debug(`Transcribe audio ${msg.voice.file_id} in ${url.toString()}`);
            msg.text = await ctx.openai.transcribeAudio(Buffer.concat(chunks), msg.voice.duration);
            resolve(true);
          });
      });
    }
  );

  return next();
}

export async function onText(ctx: BotContext) {
  const conversation = ctx.conversation.load(ctx.message as Message.TextMessage);
  if (conversation.length === 0) {
    return;
  }

  if (ctx.quota.isExceeded) {
    return ctx.sendMessage(ctx.$t('quota.exceed'));
  }

  return answer(ctx, conversation);
}

async function answer(ctx: BotContext, conversation: ChatCompletionRequestMessage[]) {
  const msg = ctx.message as Message.TextMessage;
  const choices = await callUntil(
    () => ctx.sendChatAction("typing"),
    ctx.openai.createChatCompletion(conversation)
  );

  for (const choice of choices) {
    const { content, function_call } = choice.message ?? {};

    if (choice.finish_reason === "error" && content) {
      return ctx.replyWithMarkdownV2(format("`" + content + "`").join(""));
    }

    if (function_call && functions[function_call.name!]) {
      let args = {};
      try {
        args = JSON.parse(function_call.arguments!);
      } catch (error) {
        debug("Error parse function_call.arguments", function_call.arguments);
      }

      debug(`Call function ${function_call.name} with args ${function_call.arguments}`);
      const functionResult = await functions[function_call.name!](ctx, args);
      if (typeof functionResult === "string") {
        await answer(ctx, [
          ...conversation,
          choice.message!,
          { role: "function", name: function_call.name, content: functionResult }
        ]);
      }
    }

    if (content) {
      for (const answer of format(content)) {
        const reply = await ctx.replyWithMarkdownV2(answer, { reply_to_message_id: msg.message_id });
        ctx.conversation.save(msg, reply, conversation[conversation.length - 1].content!, content);
      }
    }
  }
}