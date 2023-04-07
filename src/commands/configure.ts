import { renderTopMenu } from '../services/menu.js';

import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

export default async function(bot: TelegramBot, msg: Message) {
  return renderTopMenu(bot, msg);
}