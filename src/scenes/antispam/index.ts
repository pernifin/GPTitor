import { Scenes } from "telegraf";
import { message } from "telegraf/filters";

import { type BotContext } from "../../bot";
import { callUntil } from "../../utils";

export const ANTISPAM_SCENE_ID = "antispam";

const scene = new Scenes.BaseScene<BotContext>(
  ANTISPAM_SCENE_ID,
  {
    ttl: 60 * 60, // 1 hour
    handlers: [],
    enterHandlers: [],
    leaveHandlers: []
  }
);

scene.command("reset", async (ctx) => {
  delete ctx.session.antispamPrompt;
  return ctx.scene.reenter();
});

scene.enter(async (ctx) => {
  if (ctx.session.antispamPrompt) {
    return;
  }

  ctx.session.antispamPrompt = await callUntil(
    () => ctx.sendChatAction("typing"),
    ctx.openai.antispamPrompt()
  );
  await ctx.reply([
    ctx.$t("antispam.question"),
    ctx.session.antispamPrompt
  ].join("\n\n"));
});

scene.on(message("text"), async (ctx) => {
  if (!ctx.session.antispamPrompt) {
    return ctx.scene.reenter();
  }

  if (await ctx.openai.checkAntispam(ctx.session.antispamPrompt, ctx.message.text)) {
    delete ctx.session.antispamPrompt;
    await ctx.reply(ctx.$t("antispam.correct"));
    await ctx.scene.leave();
  } else {
    ctx.reply(ctx.$t("antispam.wrong"));
  }
});

export default scene;