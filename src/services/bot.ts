import TelegramBot, { Message } from 'node-telegram-bot-api';
import dbg from 'debug';
import axios from 'axios';

import commands, { startCommand, defaultCommand } from '../commands/index.js';
import { callMenuAction } from '../services/menu.js';
import { isChatActivated, activate } from './openai.js';

const debug = dbg('bot:init');
const logError = dbg('bot:error:*');
let botUser: TelegramBot.User;

function shouldAnswer(msg: Message) {
  return msg.chat.type === 'private' || hasBotMention(msg) || isReplyToAnswer(msg) || !!getBotCommand(msg);
}

function hasBotMention(msg: Message) {
  const botname = getBotUser().username?.toLowerCase();
  return msg.entities?.some(entity =>
    entity.type === 'mention'
    && msg.text!.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === botname
  );
}

function isReplyToAnswer(msg: Message) {
  return Boolean(msg.reply_to_message?.from?.id === getBotUser().id);
}

function getBotCommand(msg: Message) {
  const commandEntity = msg.entities?.find(entity => entity.type === 'bot_command' && entity.offset === 0);
  if (commandEntity) {
    const [command, botname] = msg.text!.substring(1, commandEntity.length).split('@');
    if ((msg.chat.type === 'private' && !botname) || (botname.toLowerCase() === botUser.username?.toLowerCase())) {
      return command;
    }
  }

  return null;
}

export async function startBot(token: string) {
  const bot = new TelegramBot(token, { polling: true });

  await bot.setMyCommands(
    commands
      .filter(cmd => cmd.public)
      .map(cmd => ({ command: cmd.name, description: cmd.description }))
  );

  // bot.setWebHook('GPTitor', {
  //   certificate: './ssl/crt.pem'
  // });

  bot.on('text', async (msg) => {
    if (!shouldAnswer(msg)) {
      return;
    }

    const command = getBotCommand(msg) || defaultCommand;
    const action = commands.find(cmd => cmd.name === command)?.action;

    if (!isChatActivated(msg.chat.id) && command !== startCommand) {
      activate(msg);
    }

    if (action) {
      debug('Incoming command "%s"', command);
      try {
        await action(bot, msg);
      } catch (error) {
        handleError(bot, msg, error);
      }
    }
  });

  bot.on('callback_query', async (query) => {
    debug('Handle menu query "%s"', query.id);
    await bot.answerCallbackQuery(query.id);
    await callMenuAction(query);
  });

  bot.on('error', (error) => debug('Bot error "%O"', error));

  botUser = await bot.getMe();
  debug('Started bot %o', botUser);

  return botUser;
}

export function getBotUser() {
  return botUser;
}

export async function handleError(bot: TelegramBot, msg: Message, error: unknown) {
  if (axios.isAxiosError(error)) {
    logError(error.response?.data?.error ?? error);
  } else if (error instanceof Error) {
    logError(error.message ?? error);
  }
}