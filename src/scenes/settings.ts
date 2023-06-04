import { Scenes, Markup } from "telegraf";
import { message } from "telegraf/filters";

import type { BotContext } from "../bot";
import config from "../config";

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

  const settings = ctx.settings.current;
  const creativity = config.creativityLevels[settings.temperature.toFixed(1) as keyof typeof config.creativityLevels];

  const message = [
    `<b>Current model</b>: ${settings.model}`,
    `<b>Creativity</b>: ${creativity}`,
    `<b>Completions to generate</b>: ${settings.completions}`,
    ctx.chat.type === "private" 
      ? `<b>Persist conversations</b>: ${settings.persist ? "Yes" : "No"}`
      : undefined
  ].join("\n");

  await ctx.replyWithHTML(message, Markup.inlineKeyboard([
    Markup.button.callback("❌ Close", "close"),
    Markup.button.callback("🛠️ Model", "model"),
    Markup.button.callback("💡 Creativity", "temperature"),
    Markup.button.callback("🔢 Completions", "completions"),
    Markup.button.callback("📥 Your dialogues", "persist", ctx.chat.type !== "private"),
  ], { columns: ctx.chat.type === "private" ? 3 : 2 }));
});

scene.action("close", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.scene.leave();
});

scene.action("model", async (ctx) => {
  const models = await ctx.openai.getEligibileModels();
  await ctx.editMessageText("Select available model:\n", Markup.inlineKeyboard(
    models.map(model => Markup.button.callback(model, `model:${model}`)),
    { columns: 3 }
  ));
});

scene.action(/model:(.+)/, async (ctx) => {
  const selectedModel = ctx.match[1];
  ctx.settings.setModel(selectedModel);

  await ctx.deleteMessage();
  await ctx.scene.reenter();
});

scene.action("temperature", async (ctx) => {
  const buttons = Object.entries(config.creativityLevels)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([id, label]) => Markup.button.callback(label, `temperature:${id}`));

  await ctx.editMessageText("Select level:\n", Markup.inlineKeyboard(
    buttons,
    { columns: 3 }
  ));
});

scene.action(/temperature:(.+)/, async (ctx) => {
  const selectedLevel = Number(ctx.match[1]);
  ctx.settings.setTemperature(selectedLevel);

  await ctx.deleteMessage();
  await ctx.scene.reenter();
});

scene.action("completions", async (ctx) => {
  ctx.scene.session.state.completions = true;
  await ctx.editMessageText(`Enter amount of completion choices to generate (1-${config.maxCompletions}):\n`);
});

scene.on(message("text"), async (ctx) => {
  if (!ctx.scene.session.state.completions) {
    return;
  }

  const completions = Number(ctx.message.text);
  if (isNaN(completions) || completions < 1 || completions > config.maxCompletions) {
    return ctx.reply(`Invalid number. Expect from 1 to ${config.maxCompletions}\n`);
  }

  ctx.settings.setCompletions(completions);
  delete ctx.scene.session.state.completions;

  await ctx.scene.reenter();
});

scene.action("persist", async (ctx) => {
  const message = [
    "By default bot keeps context within a single reply",
    "I.e. you can reply to its message with clarification only once",
    "This is because telegram doesn't provide chain of messages in reply_to_message field",
    "To overcome this limit bot can store full conversation in its database",
    "You should explicitly grant it your consent to do so",
    "For groups and channels this settings is always on"
  ].join(". ");

  await ctx.editMessageText(message, Markup.inlineKeyboard([
    Markup.button.callback("✅ Yes", "persist:yes"),
    Markup.button.callback("🚫 No", "persist:no"),
  ]));
});

scene.action(/persist:(\w+)/, async (ctx) => {
  ctx.settings.setPersist(ctx.match[1] === "yes");

  await ctx.deleteMessage();
  await ctx.scene.reenter();
});

export default scene;