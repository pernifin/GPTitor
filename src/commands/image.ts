import TelegramBot, { Message } from 'node-telegram-bot-api';

import { getInstance } from '../services/openai.js';
import { getCleanMessage } from '../utils/format.js';

export default async function(bot: TelegramBot, msg: Message) {
  const prompt = getCleanMessage(msg.text!);
  if (!prompt) {
    return;
  }

  const image = await getInstance(msg.chat.id).createImage({ prompt });
  await bot.sendPhoto(msg.chat.id, image.data.data[0].url!);
}