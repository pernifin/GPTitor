import './env.js';
import { createBot, getQuestion, getCommand } from './services/bot.js';
import * as commands from './commands/index.js';
import { escapeReponse } from './utils/format.js';

const bot = createBot();

bot.on('text', async (msg) => {
  console.log(msg);

  const chatId = msg.chat.id;

  let question = getQuestion(msg);
  let command = getCommand(msg);

  if (question) {
    command = 'answer';
  }

  if (!command || typeof commands[command] !== 'function') {
    return;
  }

  try {
    let response = await commands[command](msg, question);
    if (typeof response === 'object') {
      response = JSON.stringify(response);
    }

    console.log(response);

    return bot.sendMessage(chatId, escapeReponse(response), { parse_mode: 'MarkdownV2' });
  } catch (error) {
    console.error(error.response?.data?.error ?? error);
    // console.log(error.body);
  }
});
