import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';

import { setSetting } from '../services/openai.js';
import { renderTopMenu } from '../services/menu.js';

export default (bot: TelegramBot) => async (query: CallbackQuery) => {
  const level = query.data?.split(':')[1];
  if (level) {
    setSetting(query.message?.chat.id!, 'temperature', parseFloat(level));
  }

  return renderTopMenu(bot, query.message!);
}