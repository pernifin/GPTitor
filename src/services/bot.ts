import TelegramBot from 'node-telegram-bot-api';

import { tg } from '../config.js';
import commands from '../commands/index.js';
import { callMenuAction, getMenuActionHook } from '../services/menu.js';

const { BOT_TOKEN = '' } = process.env;

export function start() {
  const bot = createBot();
  attachCommands(bot);
  handleMenuActions(bot);
  listenToQuestions(bot);
}

export function createBot() {
  const tgBot = new TelegramBot(BOT_TOKEN, tg.options);

  // bot.setWebHook('GPTitor', {
  //   certificate: './ssl/crt.pem'
  // });

  return tgBot;
}

export function attachCommands(bot: TelegramBot) {
  bot.onText(/^\/(\w+)$/, (msg, match) => {
    if (getMenuActionHook(msg.chat.id)) {
      return;
    }
    
    const command = match?.[1] as keyof typeof commands;
    const callback = commands[command];
    if (callback) {
      callback(bot, msg);
    }
  });
}

export function handleMenuActions(bot: TelegramBot) {
  bot.on('callback_query', async (query) => {
    await bot.answerCallbackQuery(query.id);
    await callMenuAction(query);
  });
}

export function listenToQuestions(bot: TelegramBot) {
  bot.on('text', (msg) => {
    const hook = getMenuActionHook(msg.chat.id);
    if (hook) {
      return hook(msg);
    }

    commands.answer(bot, msg);
  });

  bot.on('photo', (msg) => {
    
  });
}