import answerCommand from './answer.js';
import { ai } from '../config.js';

import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

export default async function(bot: TelegramBot, msg: Message) {
  msg.text = ai.startMessage;
  return answerCommand(bot, msg);
}