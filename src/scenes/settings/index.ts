import { Scenes, Markup } from "telegraf";

import type { BotContext } from "../../bot";
import config from "../../config";
import actions from "./actions";
import { escapeText } from "../../utils/format";

export const SETTINGS_SCENE_ID = "settings";

const scene = new Scenes.BaseScene<BotContext>(
  SETTINGS_SCENE_ID,
  {
    ttl: 60 * 60, // 1 hour
    handlers: [],
    enterHandlers: [],
    leaveHandlers: []
  }
);

scene.enter(async (ctx) => {
  if (!ctx.chat) {
    return scene.leave();
  }

  ctx.settings.fix();
  const settings = ctx.settings.current;
  const mode = config.modes[settings.temperature.toFixed(1) as keyof typeof config.modes];

  const message = ctx.$t("settings.message", {
    "gpt.model": escapeText(settings.model),
    "gpt.mode": mode
  });

  await ctx.replyWithMarkdownV2(message, Markup.inlineKeyboard([
    [
      Markup.button.callback(ctx.$t("action.model"), "model"),
      Markup.button.callback(ctx.$t("action.mode"), "temperature"),
      // Markup.button.callback("🔢 Replies", "completions"),
    ],
    [Markup.button.callback(ctx.$t("action.close"), "close")]
    // Markup.button.callback("📥 Your dialogues", "persist", ctx.chat.type !== "private"),
  ]));
});

scene.action(/^(\w+)(?::(.+))?$/, async (ctx) => {
  const [, action, param] = ctx.match;
  const actionHandler = actions[action as keyof typeof actions];

  await ctx.answerCbQuery();
  if (actionHandler) {
    await actionHandler(ctx, param);
  }
});

export default scene;