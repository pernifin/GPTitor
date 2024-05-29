import type { Message } from "telegraf/types";
import OpenAIApi from "openai";
import d from "debug";

import { type BotContext } from "../../bot";
import functions from "../../functions";
import { format, callUntil } from "../../utils";

const debug = d("bot:dialog:handlers");

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
            msg.text = await ctx.openai.transcribeAudio(Buffer.concat(chunks), msg.voice.duration);
            resolve(true);
          });
      });
    }
  );

  return next();
}

export async function onText(ctx: BotContext) {
  const message = ctx.message as Message.PhotoMessage & Message.TextMessage;
  const conversation = ctx.conversation.load(message);
  if (conversation.length === 0) {
    return;
  }

  if (ctx.quota.isExceeded) {
    return ctx.sendMessage(ctx.$t('quota.exceed'));
  }

  if (message.photo) {
    const link = await ctx.telegram.getFileLink(message.photo[0].file_id);
    const userMsg = conversation[conversation.length - 1];
    userMsg.content = [
      { type: "text", text: userMsg.content as string },
      { type: "image_url", image_url: { url: link.href } },
    ];
  }

  return answer(ctx, conversation);
}

async function answer(ctx: BotContext, conversation: OpenAIApi.ChatCompletionMessageParam[]) {
  const msg = ctx.message as Message.TextMessage;
  const choices = await callUntil(
    () => ctx.sendChatAction("typing"),
    ctx.openai.createChatCompletion(conversation)
  );

  for (const choice of choices) {
    const { content, tool_calls } = choice.message ?? {};

    // @ts-ignore
    if (choice.finish_reason === "error" && content) {
      return ctx.replyWithMarkdownV2(ctx.$t("error.chat", { error: format("`" + content + "`").join("") }));
    }

    if (tool_calls?.length) {
      try {
        debug(`Calling ${JSON.stringify(tool_calls, null, 2)} tools`);

        const calls = [];
        for (const { id, function: fn } of tool_calls) {
          if (functions[fn.name]) {
            const result = await functions[fn.name](ctx, JSON.parse(fn.arguments));
            if (result) {
              calls.push({ role: "tool" as "tool", tool_call_id: id, content: result });
            }
          }
        }

        if (calls.length) {
          await answer(ctx, [
            ...conversation,
            choice.message,
            ...calls
          ]);
        }
      } catch (error) {
        console.error(`Error when calling a function: ${JSON.stringify(error, null, 2)}`);
      }
    }

    if (content) {
      for (const answer of format(content)) {
        const reply = await ctx.replyWithMarkdownV2(answer, { reply_to_message_id: msg.message_id });
        const question = conversation[conversation.length - 1].content as string;
        ctx.conversation.save(msg, reply, question, content);
      }
    }
  }
}