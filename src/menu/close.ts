import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';

import { destroyActiveMenu } from '../services/menu.js';

export default (bot: TelegramBot) => async (query: CallbackQuery) => {
  destroyActiveMenu(query.message?.chat.id!);
  await bot.deleteMessage(query.message?.chat.id!, query.message?.message_id!);
}