import config from '../config';

import type { BotContext } from "../bot";

export default async function(ctx: BotContext) {
  const { dailyTokens, startTokens } = config.userQuota;
  const message = `You have ${ctx.quota.tokens} tokens left. You receive ${dailyTokens} 
tokens once in a day if your balance is less than ${startTokens}.`;
  
  return ctx.reply(message);
}