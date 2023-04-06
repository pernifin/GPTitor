import axios from 'axios';

import openai, { getSettings } from '../services/openai.js';
import { ai, tg } from '../config.js';
import { escapeReponse } from '../utils/format.js';

import type { ChatCompletionRequestMessage } from 'openai';
import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

const conversations: { [key: number]: { [key: number]: { id: number, question: string, answer: string, replyTo?: number } } } = {};

function hasBotMention(msg: Message) {
  return msg.entities?.some(entity =>
    entity.type === 'mention'
    && msg.text!.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === tg.botName.toLowerCase()
  );
}

function isReplyToAnswer(msg: Message) {
  return Boolean(msg.reply_to_message && conversations[msg.chat.id][msg.reply_to_message?.message_id]);
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
      return hasBotMention(msg) || isReplyToAnswer(msg) ? getCleanMessage(msg) : null;
    default:
      return null;
  }
}

function getConversation(msg: Message) {
  const { systemMessage } = getSettings(msg.chat.id);
  const conversation: ChatCompletionRequestMessage[] = [];
  let replyId = msg.reply_to_message?.message_id;

  while (replyId) {
    const { question, answer, replyTo } = conversations[msg.chat.id][replyId];
    conversation.unshift(
      { role: 'user', content: question },
      { role: 'assistant', content: answer }
    );
    replyId = replyTo;
  }

  if (systemMessage) {
    conversation.unshift({ role: 'system', content: systemMessage });
  }

  return conversation;
}

function saveReply(msg: Message, reply: Message, question: string, answer: string) {
  if (!conversations[msg.chat.id]) {
    conversations[msg.chat.id] = {};
  }

  conversations[msg.chat.id][reply.message_id] = { 
    id: msg.message_id,
    question,
    answer,
    replyTo: msg.reply_to_message?.message_id
  };
}

export default async function(bot: TelegramBot, msg: Message) {
  const question = getQuestion(msg);
  if (!question) {
    return;
  }

  const messages = getConversation(msg);
  messages.push({ role: 'user', content: question });

  try {
    const { model, temperature } = getSettings(msg.chat.id);
    const { data: { choices } } = await openai.createChatCompletion({ 
      model, temperature, messages
    });

    const answer = choices.map((choice, index) => 
        `${choices.length > 1 ? String.fromCharCode(0x0031 + index, 0x20e3, 0x20): ''}${choice.message?.content}`
      )
      .join('\n\n');

    const reply = await bot.sendMessage(msg.chat.id, escapeReponse(answer), { parse_mode: 'MarkdownV2' });
    saveReply(msg, reply, question, answer);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data?.error ?? error);
    } else if (error instanceof Error) {
      console.error(error.message ?? error);
    }
  }
}