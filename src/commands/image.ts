import axios from 'axios';

import openai from '../services/openai.js';
import { getCleanMessage } from '../utils/format.js';

import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

export default async function(bot: TelegramBot, msg: Message) {
  const prompt = getCleanMessage(msg.text!);
  if (!prompt) {
    return;
  }

  try {
    const image = await openai.createImage({ prompt  });
    await bot.sendPhoto(msg.chat.id, image.data.data[0].url!);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data?.error ?? error);
    } else if (error instanceof Error) {
      console.error(error.message ?? error);
    }
  }
}