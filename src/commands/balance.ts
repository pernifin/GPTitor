import TelegramBot, { Message } from 'node-telegram-bot-api';

import config from '../config.js';
import { getQuota } from '../services/openai.ts';

export default async function(bot: TelegramBot, msg: Message) {
  const { dailyTokens, startTokens } = config.userQuota;
  const message = `
    You have ${getQuota(msg.chat.id)} tokens left. You receive ${dailyTokens} 
tokens once in a day if your balance is less than ${startTokens}.`;
  
  return bot.sendMessage(msg.chat.id, message);
}