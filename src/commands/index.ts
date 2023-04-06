import TelegramBot, { Message } from 'node-telegram-bot-api';
import { default as start } from './start.js';
import { default as configure } from './configure.js';
import { default as models } from './models.js';
import { default as answer } from './answer.js';
import { default as image } from './image.js';

type Command = (bot: TelegramBot, msg: Message) => Promise<any>;

const commands = {
  start,
  configure,
  models,
  answer,
  image
};

export default commands as { [key in keyof typeof commands]: Command };