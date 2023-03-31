import { Configuration, OpenAIApi } from 'openai';
import { ai } from '../config.js';

const { OPENAI_KEY } = process.env;

const configuration = new Configuration({
  apiKey: OPENAI_KEY
});

export default new OpenAIApi(configuration);

const settings = {};

export function getSettings(chatId, settingId = null) {
  const chatSettings = settings[chatId] ?? { ...ai.options };
  return settingId ? chatSettings[settingId] : chatSettings;
}

export function setSettings(chatId, settingId, value) {
  settings[chatId] = {
    ...settings[chatId],
    [settingId]: value
  };
}