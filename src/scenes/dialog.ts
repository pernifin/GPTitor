import { Scenes, Composer } from "telegraf";
import { message } from "telegraf/filters";
import type { Message } from "typegram";
import { Readable } from "stream";

import { type BotContext } from "../bot";
import commands from "../commands/index";
import { SETTINGS_SCENE_ID } from "./settings";
import { escape } from "../utils/format";
import config from "../config";

export const DIALOG_SCENE_ID = "dialog";

const scene = new Scenes.BaseScene<BotContext>(DIALOG_SCENE_ID);

scene.start(async (ctx) => ctx.reply(config.greeting));
scene.settings(async (ctx) => ctx.scene.enter(SETTINGS_SCENE_ID));

commands
  .filter(command => command.action)
  .forEach((command) => {
    scene.command(command.name, command.action!);
  });

scene.on(message("voice"), voiceToText);
scene.on(message("text"), Composer.optional(shouldAnswer, answer));

export default scene;

async function voiceToText(ctx: BotContext, next: () => Promise<void>) {
  await callUntil(
    () => ctx.sendChatAction("typing"), 
    new Promise(async (resolve) => {
      const msg = ctx.message as Message.VoiceMessage;
      const url = await ctx.telegram.getFileLink(msg.voice.file_id);  
      const chunks: Buffer[] = [];

      ctx.ffmpeg(url.href)
        .toFormat("mp3")
        .pipe()
        .on("data", (chunk: Buffer) => chunks.push(chunk))
        .on("end", async () => {
          const audio = Readable.from(Buffer.concat(chunks));
          // @ts-expect-error
          audio.path = "conversation.mp3";

          // @ts-expect-error
          msg.text = await ctx.openai.transcribeAudio(audio);
          resolve(true);
        });
    })
  );

  return next();
}

function shouldAnswer(ctx: BotContext) {
  const msg = ctx.message as Message.TextMessage;
  if (msg.chat.type === "private") {
    return true;
  }

  const hasBotMention = msg.entities?.some(entity =>
    entity.type === "mention"
    && msg.text!.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === ctx.me.toLowerCase()
  );
  if (hasBotMention) {
    return true;
  }

  return Boolean(msg.reply_to_message?.from?.username?.toLowerCase() === ctx.me.toLowerCase());
}

async function callUntil<T>(toCall: () => void, until: Promise<T>, interval = 5000) {
  return new Promise<T>((resolve, reject) => {
    const safeToCall = () => {
      try {
        toCall();
      } catch (error) {
        reject(error);
      }
    };

    safeToCall();
    const timer = setInterval(safeToCall, interval);

    until.then((result) => {
      clearInterval(timer);
      resolve(result);
    });
  });
}

async function answer(ctx: BotContext) {
  const msg = ctx.message as Message.TextMessage;
  if (!msg.text) {
    return;
  }

  if (ctx.quota.tokens < 10) { // Some minimum tokens
    return ctx.sendMessage(config.userQuota.exceedMessage);
  }

  const conversation = await ctx.conversation.load(msg);
  if (conversation.length === 0 || conversation[conversation.length - 1].role !== "user") {
    return;
  }

  if (config.systemMessage) {
    conversation.unshift({ role: "system", content: config.systemMessage });
  }

  const choices = await callUntil(
    () => ctx.sendChatAction("typing"),
    ctx.openai.createChatCompletion(ctx, conversation)
  );

  for (const choice of choices) {
    const answer = choice.message?.content!;

    if (answer.startsWith("image:")) {
      const image = await callUntil(
        () => ctx.sendChatAction("upload_photo"),
        ctx.openai.createImage(ctx, answer.split(":")[1])
      );

      await ctx.sendPhoto(image.url!);
    } else {
      const reply = await ctx.replyWithHTML(escape(answer), {
        reply_to_message_id: msg.reply_to_message ? msg.message_id : undefined
      });
  
      if (msg.chat.type !== "private" || ctx.settings.current.persist) {
        await ctx.conversation.save(msg, reply, conversation[conversation.length - 1].content, answer);
      }
    }
  }
}