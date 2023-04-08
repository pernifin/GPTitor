import TelegramBot, { Message, CallbackQuery, InlineKeyboardButton } from 'node-telegram-bot-api';
import chunk from 'lodash/chunk.js';

import config from '../config.js';
import { getSettings } from './openai.js';
import menuActions, { MenuAction } from '../menu/index.js';
import { escapeReponse } from '../utils/format.js';

export type MenuItem = {
  id: string;
  text: string;
  action: ReturnType<MenuAction>;
}

const activeMenu: {
  [key: number]: {
    msgId: number,
    items: MenuItem[]
  }
} = {};

export async function renderTopMenu(bot: TelegramBot, msg: Message) {
  if (activeMenu[msg.chat.id]) {
    await bot.deleteMessage(msg.chat.id, activeMenu[msg.chat.id].msgId);
  }

  const menu = buildTopMenu(bot);
  const settings = getSettings(msg.chat.id);
  const creativity = config.creativityLevels[settings.temperature.toFixed(1) as keyof typeof config.creativityLevels];
  const message = [
    `*Current model*: ${escapeReponse(settings.model)}${' '.repeat(20)}`,
    `*Creativity*: ${creativity}`,
    `*Choices to generate*: ${settings.n}`
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

function buildTopMenu(bot: TelegramBot) {
  return [
    {
      id: 'close',
      text: '❌ Close',
      action: menuActions.close(bot)
    },
    {
      id: 'model',
      text: '🛠️ Switch model',
      action: menuActions.selectModel(bot)
    },
    {
      id: 'temperature',
      text: '💡 Set creativity level',
      action: menuActions.selectCreativity(bot)
    }
  ];
}

export function setActiveMenu(msg: Message, items: MenuItem[]) {
  activeMenu[msg.chat.id] = { msgId: msg.message_id, items };
}

export function destroyActiveMenu(chatId: number) {
  delete activeMenu[chatId];
}

export function buildButtonRow(items: MenuItem[], size = 3): InlineKeyboardButton[][] {
  return chunk(items.map(({ id, text }) => ({ text, callback_data: id })), size);
}
