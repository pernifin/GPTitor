import type { Context } from "telegraf";

import config from '../config';

export default async function(ctx: Context) {
  return ctx.reply(config.greeting);
}