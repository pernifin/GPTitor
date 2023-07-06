import { Scenes, Composer } from "telegraf";
import { message } from "telegraf/filters";
import { type Message } from "typegram";

import { type BotContext } from "../../bot";
import commands from "./commands";
import actions from "./actions";
import { shouldReact, onVoice, onText } from "./handlers";
import { SETTINGS_SCENE_ID } from "../settings";

export const DIALOG_SCENE_ID = "dialog";

const scene = new Scenes.BaseScene<BotContext>(DIALOG_SCENE_ID);

scene.start(async (ctx) => ctx.reply(ctx.$t("greeting")));
scene.settings(async (ctx) => ctx.scene.enter(SETTINGS_SCENE_ID));
scene.help(async (ctx) => ctx.reply(ctx.$t("help")));
Object.keys(commands).forEach((command) => scene.command(command, commands[command as keyof typeof commands]));

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

scene.on(message("photo"), Composer.optional(shouldReact, async (ctx, next) => {
  const message = ctx.message as Message.PhotoMessage & Message.TextMessage;

  message.photo = [message.photo.sort((photoA, photoB) => photoB.file_size! - photoA.file_size!)[0]];
  message.text = message.caption ?? "";

  return next();
}));

scene.on(message("voice"), Composer.optional(shouldReact, onVoice));
scene.on(message("text"), Composer.optional(shouldReact, onText));

export default scene;