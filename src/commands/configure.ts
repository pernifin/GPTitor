import TelegramBot, { Message } from 'node-telegram-bot-api';

import { renderTopMenu } from '../services/menu.js';

export default async function(bot: TelegramBot, msg: Message) {
  return renderTopMenu(bot, msg);
}