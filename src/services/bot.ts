import TelegramBot, { Message } from 'node-telegram-bot-api';
import dbg from 'debug';
import axios from 'axios';

import commands, { startCommand, defaultCommand } from '../commands/index.js';
import { callMenuAction } from '../services/menu.js';
import { getInstance, destroyInstance } from './openai.js';

const debug = dbg('bot:init');
const logError = dbg('bot:error:*');
let botUser: TelegramBot.User;

function getBotCommand(msg: Message) {
  const commandEntity = msg.entities?.find(entity => entity.type === 'bot_command' && entity.offset === 0);
  if (commandEntity) {
    const [command, botname] = msg.text!.substring(1, commandEntity.length).split('@');
    if (!botname || botname.toLowerCase() === botUser.username?.toLowerCase()) {
      return command;
    }
  }

  return null;
}

export async function start(token: string) {
  const bot = new TelegramBot(token, { polling: true });

  await bot.setMyCommands(
    commands.map(cmd => ({ command: cmd.name, description: cmd.description }))
  );

  // bot.setWebHook('GPTitor', {
  //   certificate: './ssl/crt.pem'
  // });

  bot.on('text', async (msg) => {
    const openai = getInstance(msg.chat.id);
    const command = openai ? (getBotCommand(msg) || defaultCommand) : startCommand;
    const action = commands.find(cmd => cmd.name === command)?.action;

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
    if (error.response?.data?.error.code === 'invalid_api_key') {
      destroyInstance(msg.chat.id);
      debug(error.response?.data?.error);
      await bot.sendMessage(msg.chat.id, error.response?.data?.error.message);
    } else {
      logError(error.response?.data?.error ?? error);
    }
  } else if (error instanceof Error) {
    logError(error.message ?? error);
  }
}