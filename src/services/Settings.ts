import type { BotSession } from '../bot';
import config from '../config';

export type ChatSettings = typeof config.defaultSettings;

export default class Settings {
  private chatSettings: ChatSettings;

  constructor(session: BotSession) {
    this.chatSettings = session.chatSettings ??= { ...config.defaultSettings };
  }

  get current() {
    return this.chatSettings;
  }

  setModel(model: string) {
    if (config.models[model]) {
      this.chatSettings.model = model;
    }
  }

  setTemperature(temperature: number) {
    if (temperature >= 0 && temperature <= 2) {
      this.chatSettings.temperature = temperature;
    }
  }

  setCompletions(completions: number) {
    if (completions >= 1 && completions <= config.maxCompletions) {
      this.chatSettings.completions = completions;
    }
  }

  setPersist(persist: boolean) {
    this.chatSettings.persist = persist;
  }
}