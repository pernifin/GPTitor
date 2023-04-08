import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';

import { default as close } from './close.js';
import { default as selectModel } from './selectModel.js';
import { default as selectCreativity } from './selectCreativity.js';
import { default as setModel } from './setModel.js';
import { default as setCreativity } from './setCreativity.js';

export type MenuAction = (bot: TelegramBot) => (query: CallbackQuery) => Promise<void>;

const menuActions = {
  close,
  selectModel,
  selectCreativity,
  setModel,
  setCreativity
};

export default menuActions as { [key in keyof typeof menuActions]: MenuAction };