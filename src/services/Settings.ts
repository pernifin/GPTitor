import type { BotSession } from '../bot';
import config, { type ModelName } from '../config';

export type ChatSettings = typeof config.defaultSettings;

export default class Settings {
  private chatSettings: ChatSettings;

  constructor(private session: BotSession) {
    this.chatSettings = session.chatSettings ??= { ...config.defaultSettings };
  }

  get current() {
    return this.chatSettings;
  }

  fix() {
    const { model, temperature } = this.chatSettings;
    const needToReset = !config.models[model]
      || !config.modes[temperature.toFixed(1) as keyof typeof config.modes];

    if (needToReset) {
      this.reset();
    }
  }

  reset() {
    this.chatSettings = this.session.chatSettings = { ...config.defaultSettings };
  }

  setModel(model: ModelName) {
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
}