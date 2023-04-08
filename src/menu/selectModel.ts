import TelegramBot, { CallbackQuery, Message } from 'node-telegram-bot-api';

import config from '../config.js';
import { getInstance } from '../services/openai.js';
import { setActiveMenu, buildButtonRow } from '../services/menu.js';
import setModel from './setModel.js';

export default (bot: TelegramBot) => async (query: CallbackQuery) => {
  const response = await getInstance(query.message?.chat.id!).listEngines();
  const subMenu = response.data.data
    .filter(engine => engine.ready && config.whitelistModels.includes(engine.id))
    .map(engine => ({
      id: `model:${engine.id}`,
      text: engine.id,
      action: setModel(bot)
    }));

  const message = `${query.message?.text}\n\nSelect available model:`;
  const reply = await bot.editMessageText(message, {
    chat_id: query.message?.chat.id,
    message_id: query.message?.message_id,
    reply_markup: {
      inline_keyboard: buildButtonRow(subMenu)
    }
  });

  setActiveMenu(reply as Message, subMenu);
}