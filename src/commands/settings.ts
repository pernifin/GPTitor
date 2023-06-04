import { BotContext } from "../bot";

export default async function(ctx: BotContext) {
  await ctx.scene.enter("settings");
}