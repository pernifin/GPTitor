import openai, { getSettings, setSetting } from './openai.js';
import { escapeReponse, capitalize } from '../utils/format.js';

import type TelegramBot from 'node-telegram-bot-api';
import type { Message, CallbackQuery, InlineKeyboardButton } from 'node-telegram-bot-api';

export type MenuItem = {
  id: string;
  text: string;
  action: (query: CallbackQuery) => Promise<any>;
}

let activeMenu: { [key: number]: MenuItem[] } = {};
let menuActionHook: { [key: number]: (msg: Message) => Promise<any> } = {};

export function renderTopMenu(bot: TelegramBot, chatId: number) {
  if (!activeMenu[chatId]) {
    activeMenu[chatId] = buildTopMenu(bot);
  }

  const menu = activeMenu[chatId];
  const settings = getSettings(chatId);
  const buttons = menu.map(({ id, text }) => ({ text, callback_data: id }));
  const message = Object.entries(settings)
    .map(([key, value]) => `*${capitalize(key)}*: ${escapeReponse(value)}`)
    .join('\n');

  return bot.sendMessage(chatId, message, { 
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [buttons]
    }
  });
}

export async function callMenuAction(query: CallbackQuery) {
  const menu = activeMenu[query.message?.chat.id!];
  const menuItem = menu?.find(({ id }) => id === query.data);
  if (menuItem) {
    return menuItem.action(query);
  }
}

export function getMenuActionHook(chatId: number) {
  return menuActionHook[chatId];
}

function buildTopMenu(bot: TelegramBot) {
  const updateModel = (engineId: string) => async (query: CallbackQuery) => {
    setSetting(query.message?.chat.id!, 'model', engineId);
    await bot.deleteMessage(query.message?.chat.id!, query.message?.message_id!);
    delete activeMenu[query.message?.chat.id!];
    return renderTopMenu(bot, query.message?.chat.id!);
  };

  return [
    { 
      id: 'back', 
      text: '⏪ Back', 
      action: (query: CallbackQuery) => bot.deleteMessage(query.message?.chat.id!, query.message?.message_id!)
    },
    {
      id: 'model',
      text: '🔄 Switch model', 
      action: async (query: CallbackQuery) => {
        const response = await openai.listEngines();
        const subMenu = response.data.data
          .filter(engine => engine.ready)
          .map(engine => ({ 
            id: `model:${engine.id}`,
            text: engine.id,
            action: updateModel(engine.id)
          }));

        activeMenu[query.message?.chat.id!] = subMenu;

        const message = `${query.message?.text}\n\nSelect available model:`;
        const buttons: InlineKeyboardButton[][] = [];

        subMenu.forEach(({ id, text }, index) => {
          const row = Math.floor(index / 3);
          buttons[row] = buttons[row] || [];
          buttons[row].push({ text, callback_data: id });
        });

        return bot.editMessageText(message, {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: buttons
          }
        });
      }
    },
    {
      id: 'temperature',
      text: '↕️ Change temperature',
      action: (query: CallbackQuery) => {
        menuActionHook[query.message?.chat.id!] = async (msg: Message) => {
          const value = parseFloat(msg.text!);
          if (value >= 0 && value <= 2) {
            setSetting(msg.chat.id, 'temperature', value);
          }

          await bot.deleteMessage(msg.chat.id, query.message?.message_id!);
          delete menuActionHook[msg.chat.id];
          delete activeMenu[msg.chat.id];

          return renderTopMenu(bot, msg.chat.id);
        };

        const message = `${query.message?.text}\n\nEnter value between 0.0 and 2.0:`;
        return bot.editMessageText(message, {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
        });
      }
    }
  ];
}