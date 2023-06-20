import type { BotSession } from '../bot';
import config from '../config';

export type UserQuota = {
  tokens: number;
  lastRequestAt: number;
  lastRefreshAt: number;
};

export default class Quota {
  private userQuota: UserQuota;

  constructor(session: BotSession) {
    this.userQuota = session.userQuota ??= { 
      tokens: config.userQuota.startTokens,
      lastRequestAt: 0,
      lastRefreshAt: 0
    };

    this.refresh();
  }

  get tokens() {
    return this.userQuota.tokens;
  }

  get isExceeded() {
    return this.userQuota.tokens < 100; // Some minimum tokens
  }

  refresh() {
    const { startTokens, dailyTokens } = config.userQuota;
    const { tokens, lastRefreshAt } = this.userQuota;
    const oneDay = 1000 * 60 * 60 * 24;
  
    if ((Date.now() - lastRefreshAt) > oneDay) {
      this.userQuota.tokens = Math.min(tokens + Math.floor(dailyTokens * oneDay), startTokens);
      this.userQuota.lastRefreshAt = Date.now();
    }
  }

  consume(model: keyof typeof config.prices, baseValue: number) {
    this.userQuota.tokens -= Math.ceil(baseValue * config.prices[model] * config.userQuota.multiplier);
    this.userQuota.lastRequestAt = Date.now();
  }
}