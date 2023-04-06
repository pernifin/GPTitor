import openai, { getSettings } from '../services/openai.js';
import { getCleanMessage } from '../utils/format.js';

import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

export default async function(bot: TelegramBot, msg: Message) {
  const image = await openai.createImage({
    prompt: getCleanMessage(msg.text!),
  });

  await bot.sendPhoto(msg.chat.id, image.data.data[0].url!);
}