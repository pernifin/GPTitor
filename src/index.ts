import './env.js';
import { start } from './services/bot.js';
import { tg } from './config.js';

start();
console.log(`${tg.botName} is running`);