import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';

import { setSetting } from '../services/openai.js';
import { renderTopMenu } from '../services/menu.js';

export default (bot: TelegramBot) => async (query: CallbackQuery) => {
  const model = query.data?.split(':')[1];
  if (model) {
    setSetting(query.message?.chat.id!, 'model', model);
  }

  renderTopMenu(bot, query.message!);
}