import TelegramBot, { Message } from 'node-telegram-bot-api';

import { getInstance } from '../services/openai.js';

export default async function(bot: TelegramBot, msg: Message) {
  const response = await getInstance(msg.chat.id).listEngines();
  const message = response.data.data
    .filter(engine => engine.ready)
    .map(engine => engine.id)
    .join('\n');

  return bot.sendMessage(msg.chat.id, message);
}