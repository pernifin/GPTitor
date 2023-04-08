import { Configuration, OpenAIApi } from 'openai';
import config from '../config.js';

export type Settings = typeof config.chatCompletionSettings;

const instances: { [key: number]: { api: OpenAIApi, settings: Settings } } = {};

export function createInstance(chatId: number, key: string) {
  instances[chatId] = {
    api: new OpenAIApi(new Configuration({ apiKey: key })),
    settings: { ...config.chatCompletionSettings },
  };
}

export function destroyInstance(chatId: number) {
  delete instances[chatId];
}

export function getInstance(chatId: number) {
  return instances[chatId]?.api;
}

export function getSettings(chatId: number) {
  return instances[chatId].settings ?? null;
}

export function setSetting(chatId: number, settingId: keyof Settings, value: string|number) {
  instances[chatId].settings = {
    ...instances[chatId].settings,
    [settingId]: value
  };
}