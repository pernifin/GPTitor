import { Telegraf, Context, Scenes, session } from "telegraf";
import ffmpeg from 'fluent-ffmpeg';

import settingsScene from "./scenes/settings";
import dialogScene, { DIALOG_SCENE_ID } from "./scenes/dialog";
import { services, OpenAI, Quota, Settings, Conversation, type UserQuota, type ChatSettings } from "./services";

export interface Store<T> {
  get: (name: string) => Promise<T | undefined>;
  set: (name: string, value: T) => Promise<void>;
  delete: (name: string) => Promise<void>;
}

export interface SceneState extends Scenes.SceneSessionData {
  state: Record<string, any>;
}

export interface BotSession extends Scenes.SceneSession<SceneState> {
  userQuota?: UserQuota;
  chatSettings?: ChatSettings;
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, SceneState>;

  openai: OpenAI;
  quota: Quota;
  settings: Settings;
  conversation: Conversation;
  ffmpeg: typeof ffmpeg;
  timestamp: number;
}

export default async function createBot({
  token,
  createStore,
  logger = console.log,
  isDev = true
}: {
  token: string;
  createStore: <T>(prefix: string) => Store<T>;
  logger?: (...args: any[]) => void;
  isDev?: boolean;
}) {
  const bot = new Telegraf<BotContext>(token, { 
    telegram: { webhookReply: false },
    handlerTimeout: 1000 * 60 * 5
  });

  bot.botInfo = await bot.telegram.getMe();

  const stage = new Scenes.Stage<BotContext>(
    [dialogScene, settingsScene],
    { default: DIALOG_SCENE_ID }
  );

  bot.use(
    isDev ? Telegraf.log(logger) : Telegraf.passThru(),
    session({
      store: createStore(`/${bot.botInfo.username}/session/`),
      defaultSession: () => ({ __scenes: { state: {} } })
    }),
    services(createStore),
    stage.middleware()
  );

  return bot;
}
