import './env.js';
import { start } from './services/bot.js';

const { BOT_TOKEN = '', BOT_TOKEN_STAGE = '' } = process.env;

const token = process.env.NODE_ENV === 'production' ? BOT_TOKEN : BOT_TOKEN_STAGE;
start(token);