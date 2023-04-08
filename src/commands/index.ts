import TelegramBot, { Message } from 'node-telegram-bot-api';

import { default as start } from './start.js';
import { default as configure } from './configure.js';
import { default as models } from './models.js';
import { default as answer } from './answer.js';
import { default as image } from './image.js';

type Command = {
  name: string,
  description: string,
  action: (bot: TelegramBot, msg: Message) => Promise<void>,
};

export const startCommand = 'start';
export const defaultCommand = 'answer';

export default [
  {
    name: 'start',
    description: 'Run bot within current chat, require setting OpenAI API key',
    action: start
  },
  {
    name: 'configure',
    description: 'Bot configuration menu for current chat',
    action: configure
  },
  {
    name: 'models',
    description: 'List all available models on OpenAI',
    action: models
  },
  {
    name: 'answer',
    description: 'Don\'t use this command, instead write plain message to bot',
    action: answer
  },
  {
    name: 'image',
    description: 'Generate image from prompt (using DALL-E)',
    action: image
  }
] as Command[];