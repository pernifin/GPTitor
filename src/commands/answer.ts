import TelegramBot, { Message } from 'node-telegram-bot-api';
import { ChatCompletionRequestMessage } from 'openai';
import dbg from 'debug';

import config from '../config.js';
import { createChatCompletion, createImage, updateQuota } from '../services/openai.js';
import { escapeReponse, getCleanMessage } from '../utils/format.js';

const conversations: Record<number, Record<number, {
  msgId: number,
  question: string,
  answer: string,
  replyTo?: number
}>> = {};

const debug = dbg('bot:answer');

function getConversation(msg: Message) {
  const messages: ChatCompletionRequestMessage[] = [];
  let replyId = msg.reply_to_message?.message_id;

  if (replyId && !conversations[msg.chat.id]?.[replyId]) {
    messages.unshift(
      { role: 'user', content: msg.reply_to_message?.text! },
    );
  }

  while (replyId && conversations[msg.chat.id]?.[replyId]) {
    const { question, answer, replyTo } = conversations[msg.chat.id][replyId];
    messages.unshift(
      { role: 'user', content: question },
      { role: 'assistant', content: answer }
    );
    replyId = replyTo;
  }

  if (config.systemMessage) {
    messages.unshift({ role: 'system', content: config.systemMessage });
  }

  return messages;
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

function callUntil<T>(toCall: () => void, until: Promise<T>, interval = 5000) {
  const timer = setInterval(toCall, interval);
  toCall();

  return until.then((result) => {
    clearInterval(timer);
    return result;
  });
}

export default async function(bot: TelegramBot, msg: Message) {
  if (!updateQuota(msg.chat.id)) {
    return await bot.sendMessage(msg.chat.id, config.userQuota.exceedMessage);
  }

  debug('Incoming question in "%s"', msg.chat.title || msg.chat.username || msg.chat.first_name);
  const question = getCleanMessage(msg.text!);
  const messages = getConversation(msg);

  if (question) {
    messages.push({ role: 'user', content: question });
  }

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return;
  }

  const choices = await callUntil(
    () => bot.sendChatAction(msg.chat.id, 'typing'),
    createChatCompletion(msg.chat.id, messages)
  );

  choices.forEach(async (choice) => {
    const answer = choice.message?.content!;

    if (answer.startsWith('image:')) {
      const image = await callUntil(
        () => bot.sendChatAction(msg.chat.id, 'upload_photo'),
        createImage(msg.chat.id, answer.split(':')[1])
      );

      return await bot.sendPhoto(msg.chat.id, image.url!);
    }

    const reply = await bot.sendMessage(msg.chat.id, escapeReponse(answer), {
      parse_mode: 'MarkdownV2',
      reply_to_message_id: msg.reply_to_message ? msg.message_id : undefined
    });

    saveReply(msg, reply, question ?? messages[messages.length - 1].content, answer);
  });
}