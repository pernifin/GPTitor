import { Message } from 'node-telegram-bot-api';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import dbg from 'debug';
import config from '../config.js';

export type Settings = typeof config.chatCompletionSettings;

const debug = dbg('bot:openai');
let instance: OpenAIApi;
const chats: Record<number, { settings: Settings, addedBy: number }> = {};
const users: Record<number, { tokens: number, lastRequestAt: number}> = {};

export function setupApi(key: string) {
  instance = new OpenAIApi(new Configuration({ apiKey: key }));
}

export function getInstance() {
  return instance;
}

export function activate(msg: Message) {
  if (!chats[msg.chat.id]) {
    chats[msg.chat.id] = {
      settings: { ...config.chatCompletionSettings },
      addedBy: msg.from?.id!
    };
  }

  if (!users[msg.from!.id]) {
    users[msg.from!.id] = {
      tokens: config.userQuota.startTokens,
      lastRequestAt: 0
    };
  }
}

export function isChatActivated(chatId: number) {
  return !!chats[chatId];
}

export function updateQuota(chatId: number) {
  const userQuota = users[chats[chatId].addedBy];
  const lastRequest = new Date(userQuota.lastRequestAt).getDate();
  const today = new Date().getDate();
  if (lastRequest !== today && userQuota.tokens < config.userQuota.startTokens) {
    userQuota.tokens = Math.min(userQuota.tokens + config.userQuota.dailyTokens, config.userQuota.startTokens);
  }

  return userQuota.tokens > 0;
}

export function getQuota(chatId: number) {
  return users[chats[chatId].addedBy].tokens;
}

function consumeQuota(chatId: number, model: string, baseValue: number) {
  const userQuota = users[chats[chatId].addedBy];

  userQuota.tokens -= baseValue * config.models[model] * config.userQuota.multiplier;
  userQuota.lastRequestAt = Date.now();
}

export function getSettings(chatId: number) {
  return chats[chatId].settings ?? null;
}

export function setSetting(chatId: number, settingId: keyof Settings, value: string|number) {
  chats[chatId].settings = {
    ...chats[chatId].settings,
    [settingId]: value
  };
}

export async function createChatCompletion(chatId: number, messages: ChatCompletionRequestMessage[]) {
  const { settings } = chats[chatId];
  const request = { ...settings, messages };

  debug('createChatCompletion request: %o', request);
  const { data: { choices, usage } } = await instance.createChatCompletion(request);

  debug('Usage: %o', usage);
  if (usage?.total_tokens) {
    consumeQuota(chatId, settings.model, usage.total_tokens / 1000);
  }

  debug('Completeions %o', choices);
  return choices;
}

export async function createImage(chatId: number, prompt: string) {
  const response = await instance.createImage({ prompt });
  consumeQuota(chatId, 'dall-e', 2);

  return response.data.data[0];
}