import TelegramBot, { Message } from 'node-telegram-bot-api';

import { default as start } from './start.js';
import { default as configure } from './configure.js';
import { default as answer } from './answer.js';
import { default as balance } from './balance.js';
import { default as image } from './image.js';

type Command = {
  name: string,
  description: string,
  public?: boolean,
  action: (bot: TelegramBot, msg: Message) => Promise<void>,
};

export const startCommand = 'start';
export const defaultCommand = 'answer';

export default [
  {
    name: 'start',
    description: 'Run bot within current chat',
    public: true,
    action: start
  },
  {
    name: 'configure',
    description: 'Bot configuration menu for current chat',
    public: true,
    action: configure
  },
  {
    name: 'answer',
    description: 'Don\'t use this command, instead write plain message to bot',
    action: answer
  },
  {
    name: 'balance',
    description: 'Get your tokens balance',
    public: true,
    action: balance
  },
  {
    name: 'image',
    description: 'Generate image from prompt (using DALL-E)',
    action: image
  }
] as Command[];