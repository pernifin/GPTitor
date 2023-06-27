import { type BotCommand } from "typegram";

import type { BotContext } from "../../bot";
import config from '../../config';

export const definitions = [
  { command: "help", description: "command.help" },
  { command: "settings", description: "command.settings" },
  { command: "balance", description: "command.balance" }
] as BotCommand[];

export default {
  async balance(ctx: BotContext) {
    const { dailyTokens, startTokens } = config.userQuota;
    const message = ctx.$t("balance.message", { tokens: ctx.quota.tokens, dailyTokens, startTokens });

    return ctx.reply(message);
  },
  async models(ctx: BotContext) {
    const models = await ctx.openai.getModels(true);
    return ctx.reply(models.join("\n"));
  },
  async reset(ctx: BotContext) {
    ctx.settings.reset();
    return ctx.reply(ctx.$t("reset.message"));
  }
} as const;