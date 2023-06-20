import { Markup } from "telegraf";

import type { BotContext } from "../../bot";
import config, { type ModelName } from "../../config";

export default {
  async close(ctx: BotContext) {
    await ctx.deleteMessage();
    return ctx.scene.leave();
  },

  async model(ctx: BotContext) {
    const models = await ctx.openai.getModels();

    return ctx.editMessageReplyMarkup(Markup.inlineKeyboard(
      models.map(model => Markup.button.callback(model, `selectModel:${model}`)),
      { columns: 3 }
    ).reply_markup);
  },

  async selectModel(ctx: BotContext, selectedModel: ModelName) {
    ctx.settings.setModel(selectedModel);
    await ctx.deleteMessage();

    return ctx.scene.reenter();
  },

  async temperature(ctx: BotContext) {
    const buttons = Object.entries(config.modes)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([id, label]) => Markup.button.callback(label, `setTemperature:${id}`));

    return ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons, { columns: 2 }).reply_markup);
  },

  async setTemperature(ctx: BotContext, selectedLevel: string) {
    ctx.settings.setTemperature(Number(selectedLevel));
    await ctx.deleteMessage();

    return ctx.scene.reenter();
  },

  // async completions(ctx: BotContext) {
  //   const makeBtn = (index: number) => Markup.button.callback(
  //     String.fromCharCode(0x0031 + index, 0xfe0f, 0x20e3),
  //     `setCompletions:${index + 1}`
  //   );

  //   return ctx.editMessageReplyMarkup(Markup.inlineKeyboard(
  //     Array(config.maxCompletions).fill(null).map((_, index) => makeBtn(index))
  //   ).reply_markup);
  // },

  // async setCompletions(ctx: BotContext, selectedCompletions: string) {
  //   ctx.settings.setCompletions(Number(selectedCompletions));
  //   await ctx.deleteMessage();

  //   return ctx.scene.reenter();
  // }
} as const;