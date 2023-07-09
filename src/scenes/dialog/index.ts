import { Scenes } from "telegraf";
import { message } from "telegraf/filters";

import { type BotContext } from "../../bot";
import commands from "./commands";
import actions from "./actions";
import { onPhoto, onVoice, onText } from "./handlers";
import { SETTINGS_SCENE_ID } from "../settings";
import { queue, antispam, shouldReact } from "./middleware";

export const DIALOG_SCENE_ID = "dialog";

const scene = new Scenes.BaseScene<BotContext>(DIALOG_SCENE_ID);

scene.use(queue());
scene.start(async (ctx) => ctx.reply(ctx.$t("greeting")));
scene.settings(async (ctx) => ctx.scene.enter(SETTINGS_SCENE_ID));
scene.help(async (ctx) => ctx.reply(ctx.$t("help")));
Object.entries(commands).forEach(([cmdName, command]) => scene.command(cmdName, command));

scene.action(/.+/, async (ctx, next) => {
  await ctx.answerCbQuery();
  return next();
});

scene.action(/^(\w+)(?::(.+))?$/, async (ctx) => {
  const [, action, param] = ctx.match;
  if (actions[action as keyof typeof actions]) {
    await actions[action as keyof typeof actions](ctx, param);
  }
});

scene.use(shouldReact(), antispam());
scene.on(message("photo"), onPhoto);
scene.on(message("voice"), onVoice);
scene.on(message("text"), onText);

export default scene;