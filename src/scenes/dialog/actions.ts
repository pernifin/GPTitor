import { Markup } from "telegraf";

import { type Message, type CallbackQuery, type InlineKeyboardMarkup, type InlineKeyboardButton } from "telegraf/types";
import { type GeneratedImage } from "../../services/Midjourney";
import type { BotContext } from "../../bot";
import { format, callUntil } from "../../utils";

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
const stubBtn = Markup.button.callback(" ", " ");

const updateKeyboard = (markup: InlineKeyboardMarkup, replace: string) =>
  Markup.inlineKeyboard(
    markup.inline_keyboard.map((row) =>
      row.map((btn) =>
        (btn as InlineKeyboardButton.CallbackButton)?.callback_data === replace ? stubBtn : btn
      )
    )
  ).reply_markup;

async function sendImage(ctx: BotContext, imageWhen: Promise<GeneratedImage>) {
  try {
    const image = await imageWhen;
    const keyboard = image.type === "upscale" ? upscaleKeyboard(ctx, image) : generationKeyboard(ctx, image);
    return callUntil(
      () => ctx.sendChatAction("upload_photo"),
      ctx.sendPhoto(image.image, keyboard)
    );
  } catch (error: any) {
    return ctx.sendMessage(error.message ?? ctx.$t("error.noimage"));
  }
}

const trackProgress = async (ctx: BotContext, callback: (tracker: (progress: number) => void) => Promise<any>) => {
  const renderProgress = (progress: number) => format(ctx.$t("render.progress", { progress })).join("");
  const msg = await ctx.replyWithMarkdownV2(renderProgress(0));

  await callback((progress: number) => {
    progress > 0 && ctx.telegram.editMessageText(
      msg.chat.id,
      msg.message_id,
      undefined,
      renderProgress(progress),
      { parse_mode: "MarkdownV2" }
    );
  });

  ctx.deleteMessage(msg.message_id);
};

export default {
  async fullsize(ctx: BotContext, imageUrl: string) {
    await callUntil(
      () => ctx.sendChatAction("upload_photo"),
      ctx.sendDocument(imageUrl)
    );
  },
  async generate(ctx: BotContext, prompt: string) {
    // await trackProgress(ctx, (setProgress) => {
    //   const message = (ctx.message || ctx.callbackQuery?.message) as Message.PhotoMessage & Message.TextMessage;
    //   if (message.photo) {
    //     prompt = `${ctx.host}/file/${message.photo[0].file_id}.png ${prompt}`;
    //   }

    //   return sendImage(ctx, ctx.midjourney.generate(prompt, setProgress));
    // });
    const message = (ctx.message || ctx.callbackQuery?.message) as Message.TextMessage;

    return sendImage(ctx, ctx.midjourney.generate(prompt));
  },

  async upscale(ctx: BotContext, payload: string) {
    const { message, data }: { message?: Message.CommonMessage, data: string } =
      (ctx.callbackQuery as CallbackQuery.DataQuery);
    if (message?.reply_markup && data) {
      await ctx.editMessageReplyMarkup(updateKeyboard(message.reply_markup, data));
    }

    await callUntil(
      () => ctx.sendChatAction("upload_photo"),
      sendImage(ctx, ctx.midjourney.upscale(payload))
    );
  },

  async variate(ctx: BotContext, payload: string) {
    await trackProgress(ctx, (setProgress) => sendImage(ctx, ctx.midjourney.variate(payload, setProgress)));
  },

  async regenerate(ctx: BotContext, hash: string) {
    const prompt = await ctx.midjourney.getPrompt(hash);
    if (!prompt) {
      return ctx.reply(ctx.$t("error.image-not-found"));
    }

    return this.generate(ctx, prompt);
  },

  async outpaint(ctx: BotContext, hash: string) {
    await trackProgress(ctx, (setProgress) => {
      const [generationHash, level] = hash.split("-");
      return sendImage(
        ctx,
        ctx.midjourney.outpaint(generationHash, level as "high" | "low" | "2x" | "1.5x", setProgress)
      );
    });
  }
} as const;