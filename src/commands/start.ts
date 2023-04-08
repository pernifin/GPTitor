import TelegramBot, { Message } from 'node-telegram-bot-api';

import { createInstance } from '../services/openai.js';
import { getCleanMessage } from '../utils/format.js';

export default async function(bot: TelegramBot, msg: Message) {
  const openaiKey = getCleanMessage(msg.text!);

  if (openaiKey && /^sk-\w{48}$/.test(openaiKey)) {
    createInstance(msg.chat.id, openaiKey);
    return bot.deleteMessage(msg.chat.id, msg.message_id);
  }

  const message = 'Please run /start command and provide your valid OpenAI API key to start using this bot';
  return bot.sendMessage(msg.chat.id, message);
}