import './env.js';
import { startBot } from './services/bot.ts';
import { setupApi } from './services/openai.ts';

const { BOT_TOKEN = '', BOT_TOKEN_STAGE = '', OPENAI_KEY = '' } = process.env;

const token = process.env.NODE_ENV === 'production' ? BOT_TOKEN : BOT_TOKEN_STAGE;

setupApi(OPENAI_KEY);
startBot(token);