import TelegramBot, { Message } from 'node-telegram-bot-api';

import { activate } from '../services/openai.js';
import config from '../config.js';

export default async function(bot: TelegramBot, msg: Message) {
  activate(msg);
  return bot.sendMessage(msg.chat.id, config.greeting);
}