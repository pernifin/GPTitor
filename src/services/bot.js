import TelegramBot from 'node-telegram-bot-api';
import { bot } from '../config.js';

export function createBot() {
  const tgBot = new TelegramBot(process.env.BOT_TOKEN, bot.options);

  // bot.setWebHook('GPTitor', {
  //   certificate: './ssl/crt.pem'
  // });

  return tgBot;
}

function getMentionEntity(msg) {
  return msg.entities?.find(entity =>
    entity.type === 'mention'
    && msg.text.substring(entity.offset + 1, entity.offset + entity.length).toLowerCase() === bot.name
  );
}

export function getQuestion(msg) {
  if (msg.chat.type === 'private') {
    return msg.text.replace(/\b@\w+\b/gm, '');
  }

  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    const mention = getMentionEntity(msg);
    if (mention) {
      return msg.text.substring(mention.offset + mention.length + 1)
    }
  }

  return null;
}

export function getCommand(msg) {
  const entity = msg.entities?.find(entity => entity.type === 'bot_command' && entity.offset === 0);

  if (entity) {
    const [command, botname = ''] = msg.text.substring(entity.offset + 1, entity.offset + entity.length + 1).split('@');
    return msg.chat.type === 'private' || botname.toLowerCase() === bot.name ? command : null;
  }
}