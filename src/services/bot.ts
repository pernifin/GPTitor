import TelegramBot from 'node-telegram-bot-api';
import dbg from 'debug';

import { tg } from '../config.js';
import commands from '../commands/index.js';
import { callMenuAction } from '../services/menu.js';

const debug = dbg('bot:handlers');
const { BOT_TOKEN = '', BOT_TOKEN_STAGE = '' } = process.env;

export function start() {
  const bot = new TelegramBot(process.env.NODE_ENV === 'production' ? BOT_TOKEN : BOT_TOKEN_STAGE, tg.options);

  // bot.setWebHook('GPTitor', {
  //   certificate: './ssl/crt.pem'
  // });
  
  bot.onText(/^\/(\w+)(?:\s.+)?$/, (msg, match) => {
    const cmdName = match?.[1] as keyof typeof commands;
    const command = commands[cmdName];

    debug('Incoming command "%s"', cmdName);
    if (command) {
      command(bot, msg);
    }
  });

  bot.on('callback_query', async (query) => {
    debug('Handle menu query "%s"', query.id);
    await bot.answerCallbackQuery(query.id);
    await callMenuAction(query);
  });

  bot.on('text', (msg) => commands.answer(bot, msg));

  bot.on('error', (error) => debug('Bot error "%O"', error));
}
