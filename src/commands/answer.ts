import axios from 'axios';
import dbg from 'debug';

import openai, { getSettings } from '../services/openai.js';
import { tg } from '../config.js';
import { escapeReponse, getCleanMessage } from '../utils/format.js';

import type { ChatCompletionRequestMessage } from 'openai';
import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';

const conversations: { 
  [key: number]: {
    [key: number]: {
      msgId: number,
      question: string,
      answer: string,
      replyTo?: number
    }
  }
} = {};

const debug = dbg('bot:answer');

function hasBotMention(msg: Message) {
  return msg.entities?.some(entity =>
    entity.type === 'mention'
    && msg.text!.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === tg.botName.toLowerCase()
  );
}

function hasBotCommand(msg: Message) {
  return msg.entities?.some(entity => entity.type === 'bot_command');
}

function isReplyToAnswer(msg: Message) {
  return Boolean(msg.reply_to_message && conversations[msg.chat.id]?.[msg.reply_to_message?.message_id]);
}

function shouldAnswer(msg: Message) {
  return msg.chat.type === 'private' || hasBotMention(msg) || isReplyToAnswer(msg);
}

function getQuestion(msg: Message) {
  switch (msg.chat.type) {
    case 'private':
      return getCleanMessage(msg.text!);
    case 'group':
    case 'supergroup':
      return hasBotMention(msg) || isReplyToAnswer(msg) ? getCleanMessage(msg.text!) : null;
    default:
      return null;
  }
}

function getConversation(msg: Message) {
  const { systemMessage } = getSettings(msg.chat.id);
  const conversation: ChatCompletionRequestMessage[] = [];
  let replyId = msg.reply_to_message?.message_id;

  if (replyId && !conversations[msg.chat.id]?.[replyId] && msg.reply_to_message !== null && msg.reply_to_message?.text !== null) {
    conversation.unshift(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { role: 'user', content: msg.reply_to_message?.text! },
    );
  }

  while (replyId && conversations[msg.chat.id]?.[replyId]) {
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
    msgId: msg.message_id,
    question,
    answer,
    replyTo: msg.reply_to_message?.message_id
  };
}

export default async function(bot: TelegramBot, msg: Message) {
  if (hasBotCommand(msg) || !shouldAnswer(msg)) {
    return;
  }

  debug('Incoming question in "%s"', msg.chat.title || msg.chat.username || msg.chat.first_name);
  const question = getQuestion(msg);
  const messages = getConversation(msg);

  if (question) {
    messages.push({ role: 'user', content: question });
  }
  
  if (messages.length === 0 || messages[messages.length - 1].role === 'assistant') {
    return;
  }

  try {
    const { model, temperature } = getSettings(msg.chat.id);
    const { data: { choices } } = await openai.createChatCompletion({ 
      model, temperature, messages
    });

    const answer = choices.map((choice, index) => 
        `${choices.length > 1 ? String.fromCharCode(0x0031 + index, 0x20e3, 0x20): ''}${choice.message?.content}`
      )
      .join('\n\n');

    const reply = await bot.sendMessage(msg.chat.id, escapeReponse(answer), { 
      parse_mode: 'MarkdownV2',
      reply_to_message_id: isReplyToAnswer(msg) ? msg.message_id : undefined
    });
    saveReply(msg, reply, question ?? messages[messages.length - 1].content, answer);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data?.error ?? error);
    } else if (error instanceof Error) {
      console.error(error.message ?? error);
    }
  }
}