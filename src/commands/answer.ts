import axios from 'axios';

import openai, { getSettings } from '../services/openai.js';
import { ai, tg } from '../config.js';
import { escapeReponse } from '../utils/format.js';

import type { ChatCompletionRequestMessage } from 'openai';
import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

function hasBotMention(msg: Message) {
  return msg.entities?.some(entity =>
    entity.type === 'mention'
    && msg.text!.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === tg.botName
  );
}

function getCleanMessage(msg: Message) {
  return msg.text!.replace(/(^|\s)([\/@]\w+(?=\s|\/|@|$))+/gm, '');
}

function getQuestion(msg: Message) {
  switch (msg.chat.type) {
    case 'private':
      return getCleanMessage(msg);
    case 'group':
    case 'supergroup':
      return hasBotMention(msg) ? getCleanMessage(msg) : null;
    default:
      return null;
  }
}

async function getAnswer(msg: Message, question: string) {
  const settings = getSettings(msg.chat.id);
  const messages: ChatCompletionRequestMessage[] = [
    { role: 'user', content: question }
  ];

  if (ai.systemMessage) {
    messages.unshift(
      { role: 'system', content: ai.systemMessage }
    );
  }

  const response = await openai.createChatCompletion({ ...settings, messages });
  return response.data.choices
    .map(choice => choice.message?.content)
    .join('\n');
}

export default async function(bot: TelegramBot, msg: Message) {
  const question = getQuestion(msg);
  if (!question) {
    return;
  }

  try {
    const answer = await getAnswer(msg, question);
    return bot.sendMessage(msg.chat.id, escapeReponse(answer), { parse_mode: 'MarkdownV2' });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data?.error ?? error);
    } else if (error instanceof Error) {
      console.error(error.message ?? error);
    }
  }
}