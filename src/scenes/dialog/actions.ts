import { Markup } from "telegraf";
import { type Message } from "typegram";
import sharp from "sharp";
import fetch from "node-fetch";

import type { BotContext } from "../../bot";
import { callUntil } from "../../utils";

const range4 = Array(4).fill(null).map((_, i) => i);

async function splitImage(imageUrl: string) {
  const imageBuffer = await fetch(imageUrl).then(response => response.arrayBuffer());
  const size = (await sharp(imageBuffer).metadata()).width! / 2;
  return Promise.all(
    range4.map(
      (i) => sharp(imageBuffer)
        .extract({ left: (i % 2) * size, top: Math.floor(i / 2) * size, width: size, height: size })
        .toBuffer()
    )
  );
}

async function sendSingle(ctx: BotContext, imageUrl: string, hash: string, payload?: string) {
  return ctx.sendPhoto(imageUrl, Markup.inlineKeyboard([
    range4.map((i) =>
      Markup.button.callback(`🔄${String.fromCharCode(0x0031 + i, 0xfe0f, 0x20e3)}`, `variate:${hash}-${i + 1}`)
    ),
    [
      Markup.button.callback(ctx.$t("action.split"), `split:${hash}`),
      Markup.button.callback(ctx.$t("action.regenerate"), payload ? `variate:${payload}` : `regenerate:${hash}`),
    ]
  ]));
}

async function sendMultiple(ctx: BotContext, imageUrl: string, hash: string) {
  const buffers = await splitImage(imageUrl);
  return Promise.all(
    buffers.map((buffer, i) => ctx.sendPhoto({ source: buffer }, Markup.inlineKeyboard([
      Markup.button.callback(ctx.$t("action.variate"), `variate:${hash}-${i + 1}`)
    ])))
  );
}

async function sendImage(ctx: BotContext, imageUrl: string, hash: string, payload?: string) {
  const length = await fetch(imageUrl, { method: "HEAD" })
    .then((response) => +response.headers.get("content-length")!);

  return length > 1024 * 1024 * 5 // 5MB
    ? sendMultiple(ctx, imageUrl, hash)
    : sendSingle(ctx, imageUrl, hash, payload);
}

export default {
  async generate(ctx: BotContext, prompt: string) {
    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => {
        const message = ctx.message as Message.PhotoMessage & Message.TextMessage;
        if (message.photo) {
          const link = await ctx.telegram.getFileLink(message.photo[0].file_id);
          prompt = `${link.href} ${prompt}`;
        }

        const image = await ctx.midjourney.generate(prompt);
        if (!image) {
          return ctx.reply(ctx.$t("error.generate-image-failed"));
        }

        return sendImage(ctx, image.url, image.hash);
      }
    );
  },

  async variate(ctx: BotContext, payload: string) {
    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => {
        const [savedHash, index] = payload.split("-");
        const image = await ctx.midjourney.variate(savedHash, +index);
        if (!image) {
          return ctx.reply(ctx.$t("error.generate-image-failed"));
        }
    
        return sendImage(ctx, image.url, image.hash, payload);
      }
    );
  },

  async regenerate(ctx: BotContext, hash: string) {
    const { prompt } = ctx.midjourney.getResult(hash) ?? {};
    if (!prompt) {
      return ctx.reply(ctx.$t("error.image-not-found"));
    }

    return this.generate(ctx, prompt);
  },

  async split(ctx: BotContext, hash: string) {
    const result = ctx.midjourney.getResult(hash);
    if (!result) {
      return ctx.reply(ctx.$t("error.image-not-found"));
    }

    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => {
        const buffers = await splitImage(result.imageUrl);
        return ctx.sendMediaGroup(
          buffers.map((buffer) => ({ 
            type: "photo",
            caption: result.prompt,
            media: { source: buffer }
          }))
        );
      }
    );
  }
} as const;