import TelegramBot, { Message } from 'node-telegram-bot-api';
import { ChatCompletionRequestMessage } from 'openai';
import dbg from 'debug';

import config from '../config.js';
import { getSettings, getInstance } from '../services/openai.js';
import { getBotUser } from '../services/bot.js';
import { escapeReponse, getCleanMessage } from '../utils/format.js';

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
  const botname = getBotUser().username?.toLowerCase();
  return msg.entities?.some(entity =>
    entity.type === 'mention'
    && msg.text!.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === botname
  );
}

function isReplyToAnswer(msg: Message) {
  return Boolean(msg.reply_to_message && conversations[msg.chat.id]?.[msg.reply_to_message?.message_id]);
}

function shouldAnswer(msg: Message) {
  return msg.chat.type === 'private' || hasBotMention(msg) || isReplyToAnswer(msg);
}

function getChoiceNumber(index: number): string {
  return (index > 9 ? getChoiceNumber(Math.floor(index / 10)) : '')
    + String.fromCharCode(0x0031 + index % 10, 0x20e3, 0x20);
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
  const conversation: ChatCompletionRequestMessage[] = [];
  let replyId = msg.reply_to_message?.message_id;

  if (replyId && !conversations[msg.chat.id]?.[replyId]) {
    conversation.unshift(
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

  if (config.systemMessage) {
    conversation.unshift({ role: 'system', content: config.systemMessage });
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
  if (!shouldAnswer(msg)) {
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

  const { data: { choices } } = await getInstance(msg.chat.id).createChatCompletion({
    ...getSettings(msg.chat.id), messages
  });

  const answer = choices
    .map((choice, index) => `${choices.length > 1 ? getChoiceNumber(index) : ''}${choice.message?.content}`)
    .join('\n\n');

  const reply = await bot.sendMessage(msg.chat.id, escapeReponse(answer), {
    parse_mode: 'MarkdownV2',
    reply_to_message_id: isReplyToAnswer(msg) ? msg.message_id : undefined
  });

  saveReply(msg, reply, question ?? messages[messages.length - 1].content, answer);
}