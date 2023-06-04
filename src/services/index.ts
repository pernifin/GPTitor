// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

import type { BotContext, Store } from "../bot";

import OpenAI from "./OpenAI";
import Quota from "./Quota";
import Settings from "./Settings";
import Conversation from "./Conversation";

export { default as OpenAI } from "./OpenAI";
export { default as Quota, UserQuota } from "./Quota";
export { default as Settings, ChatSettings } from "./Settings";
export { default as Conversation } from "./Conversation";

export function services(createStore: <T>(prefix: string) => Store<T>) {
  // ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  
  return (ctx: BotContext, next: () => Promise<void>) => {
    ctx.openai = new OpenAI(process.env.OPENAI_KEY!, ctx);
    ctx.quota = new Quota(ctx.session);
    ctx.settings = new Settings(ctx.session);
    ctx.conversation = new Conversation(createStore(`/${ctx.me}/conversation/`), ctx.me);
    ctx.ffmpeg = ffmpeg;
    ctx.timestamp = Date.now();
  
    return next();
  }
}