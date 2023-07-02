import { Markup } from "telegraf";
import { type Message } from "typegram";

import { type GeneratedImage } from "../../services/Midjourney";
import type { BotContext } from "../../bot";
import { callUntil } from "../../utils";

const iconNum = (i: number) => String.fromCharCode(0x0030 + i, 0xfe0f, 0x20e3);
const makeBtnRow = (image: GeneratedImage, action: string, icon: string) =>
  Array.from({ length: 4 }, (n, i) => Markup.button.callback(
    `${icon}${iconNum(i + 1)}`,
    `${action}:${image.indexHashes[i]}`
  ));

const generationKeyboard = (ctx: BotContext, image: GeneratedImage) => {
  const btns = [
    ...makeBtnRow(image, "variate", "🔄"),
    ...makeBtnRow(image, "upscale", "⏫️")
  ];

  return Markup.inlineKeyboard([
    btns.filter((_, i) => !Math.floor(i % 4 / 2)),
    btns.filter((_, i) => Math.floor(i % 4 / 2)),
    [
      Markup.button.callback(
        ctx.$t("action.regenerate"),
        `${image.type === "variation" ? 'variate' : 'regenerate'}:${image.hash}`
      )
    ]
  ]);
};
const upscaleKeyboard = (ctx: BotContext, image: GeneratedImage) => Markup.inlineKeyboard([
  [
    Markup.button.callback(ctx.$t("action.variateHigh"), `outpaint:${image.hash}-high`),
    Markup.button.callback(ctx.$t("action.variateLow"), `outpaint:${image.hash}-low`),
  ],
  [
    Markup.button.callback(ctx.$t("action.outpaint20"), `outpaint:${image.hash}-2x`),
    Markup.button.callback(ctx.$t("action.outpaint15"), `outpaint:${image.hash}-1.5x`),
  ]
]);

async function sendImage(ctx: BotContext, imageWhen: Promise<GeneratedImage>) {
  return imageWhen.then((image) => {
    const keyboard = image.type === "upscale" ? upscaleKeyboard(ctx, image) : generationKeyboard(ctx, image);
    return ctx.sendPhoto(image.image, keyboard);
  }, (error) => {
    return ctx.reply(error.message ?? ctx.$t("error.noimage"));
  });
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

        return sendImage(ctx, ctx.midjourney.generate(prompt));
      }
    );
  },

  async upscale(ctx: BotContext, payload: string) {
    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => sendImage(ctx, ctx.midjourney.upscale(payload))
    );
  },

  async variate(ctx: BotContext, payload: string) {
    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => sendImage(ctx, ctx.midjourney.variate(payload))
    );
  },

  async regenerate(ctx: BotContext, hash: string) {
    const prompt = ctx.midjourney.getPrompt(hash);
    if (!prompt) {
      return ctx.reply(ctx.$t("error.image-not-found"));
    }

    return this.generate(ctx, prompt);
  },

  async outpaint(ctx: BotContext, hash: string) {
    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      async () => {
        const [generationHash, level] = hash.split("-");
        return sendImage(ctx, ctx.midjourney.outpaint(generationHash, level as "high" | "low" | "2x" | "1.5x"));
      }
    );
  }
} as const;