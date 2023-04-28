import TelegramBot, { Message } from 'node-telegram-bot-api';

import { createImage } from '../services/openai.js';
import { getCleanMessage } from '../utils/format.js';

export default async function(bot: TelegramBot, msg: Message) {
  const prompt = getCleanMessage(msg.text!);
  if (!prompt) {
    return;
  }

  const image = await createImage(msg.chat.id, prompt);
  await bot.sendPhoto(msg.chat.id, image.url!);
}