import { Configuration, OpenAIApi } from 'openai';
import { ai } from '../config.js';

const { OPENAI_KEY = '' } = process.env;
const settings: { [key: number]: Settings } = {};
const configuration = new Configuration({ apiKey: OPENAI_KEY });

export type Settings = typeof ai.defaultSettings;

export default new OpenAIApi(configuration);

export function getSettings(chatId: number) {
  return { ...ai.defaultSettings, ...settings[chatId] };
}

export function setSetting(chatId: number, settingId: keyof Settings, value: any) {
  settings[chatId] = {
    ...settings[chatId],
    [settingId]: value
  };
}