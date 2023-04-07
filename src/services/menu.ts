import chunk from 'lodash/chunk.js';
import { ai } from '../config.js';
import openai, { getSettings, setSetting } from './openai.js';
import { escapeReponse } from '../utils/format.js';

import type TelegramBot from 'node-telegram-bot-api';
import type { Message, CallbackQuery, InlineKeyboardButton } from 'node-telegram-bot-api';

export type MenuItem = {
  id: string;
  text: string;
  action: (query: CallbackQuery) => Promise<any>;
}

const activeMenu: { [key: number]: { msgId: number, items: MenuItem[] } } = {};
const menuActionHook: { [key: number]: (msg: Message) => Promise<any> } = {};

export async function renderTopMenu(bot: TelegramBot, msg: Message) {
  if (activeMenu[msg.chat.id]) {
    await bot.deleteMessage(msg.chat.id, activeMenu[msg.chat.id].msgId);
  } 

  const menu = buildTopMenu(bot);
  const settings = getSettings(msg.chat.id);
  const message = [
    `*Current model*: ${escapeReponse(settings.model)}`,
    `*Creativity*: ${getCreativityLabel(settings.temperature)}`,
    `*System message*: ${escapeReponse(settings.systemMessage || 'N/A')}`,
  ].join('\n');

  const reply = await bot.sendMessage(msg.chat.id, message, { 
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: buildButtonRow(menu)
    }
  });

  setActiveMenu(reply, menu);
}

export async function callMenuAction(query: CallbackQuery) {
  return activeMenu[query.message?.chat.id!]
    ?.items
    ?.find(({ id }) => id === query.data)
    ?.action(query);
}

export function getMenuActionHook(chatId: number) {
  return menuActionHook[chatId];
}

function buildTopMenu(bot: TelegramBot) {
  return [
    { 
      id: 'back',
      text: '⏪ Back',
      action: (query: CallbackQuery) => {
        delete activeMenu[query.message?.chat.id!];
        return bot.deleteMessage(query.message?.chat.id!, query.message?.message_id!);
      }
    },
    {
      id: 'model',
      text: '🛠️ Switch model', 
      action: async (query: CallbackQuery) => {
        const response = await openai.listEngines();
        const subMenu = response.data.data
          .filter(engine => engine.ready && ai.whitelistModels.includes(engine.id))
          .map(engine => ({ 
            id: `model:${engine.id}`,
            text: engine.id,
            action: (query: CallbackQuery) => {
              setSetting(query.message?.chat.id!, 'model', engine.id);
              return renderTopMenu(bot, query.message!);
            }
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
    },
    {
      id: 'temperature',
      text: '💡 Set creativity level',
      action: async (query: CallbackQuery) => {
        const subMenu = Object.entries(ai.creativityLevels)
          .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
          .map(([id, label]) => ({ 
            id: `level:${id}`,
            text: label,
            action: (query: CallbackQuery) => {
              setSetting(query.message?.chat.id!, 'temperature', parseFloat(id));
              return renderTopMenu(bot, query.message!);
            }
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
    }
  ];
}

function setActiveMenu(msg: Message, items: MenuItem[]) {
  activeMenu[msg.chat.id] = { msgId: msg.message_id, items };
}

function buildButtonRow(items: MenuItem[], size = 3): InlineKeyboardButton[][] {
  return chunk(items.map(({ id, text }) => ({ text, callback_data: id })), size);
}

function getCreativityLabel(value: number) {
  return ai.creativityLevels[value.toFixed(1) as keyof typeof ai.creativityLevels];
}