import TelegramBot, { CallbackQuery, Message } from 'node-telegram-bot-api';

import config from '../config.js';
import { setActiveMenu, buildButtonRow } from '../services/menu.js';
import setCreativity from './setCreativity.js';

export default (bot: TelegramBot) => async (query: CallbackQuery) => {
  const subMenu = Object.entries(config.creativityLevels)
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([id, label]) => ({
      id: `level:${id}`,
      text: label,
      action: setCreativity(bot)
    }));

  const message = `${query.message?.text}\n\nSelect level:\n`;
  const reply = await bot.editMessageText(message, {
    chat_id: query.message?.chat.id,
    message_id: query.message?.message_id,
    reply_markup: {
      inline_keyboard: buildButtonRow(subMenu)
    }
  });

  setActiveMenu(reply as Message, subMenu);
}