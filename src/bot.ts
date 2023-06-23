import { Telegraf, Context, Scenes, session, MemorySessionStore } from "telegraf";
import ffmpeg from "fluent-ffmpeg";

import { definitions } from "./scenes/dialog/commands";
import settingsScene from "./scenes/settings";
import dialogScene, { DIALOG_SCENE_ID } from "./scenes/dialog";
import {
  services, OpenAI, Quota, Settings, Translation, Conversation, Midjourney, type UserQuota, type ChatSettings
} from "./services";

export type Store<T> = {
  get: (name: string) => Promise<T | undefined>;
  set: (name: string, value: T) => Promise<void>;
  delete: (name: string) => Promise<void>;
};

export type SceneState = Scenes.SceneSessionData & {
  state: Record<string, any>;
};

export type BotSession = Scenes.SceneSession<SceneState> & {
  userQuota?: UserQuota;
  chatSettings?: ChatSettings;
};

export type BotContext = Context & {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, SceneState>;

  openai: OpenAI;
  quota: Quota;
  settings: Settings;
  conversation: Conversation;
  midjourney: Midjourney;
  ffmpeg: typeof ffmpeg;
  timestamp: number;
  $t: (text: string, tokens?: Record<string, string | number>) => string;
};

export type BotOptions = {
  domain: string,
  path: string,
  createStore?: <T>(botname: string, collectionName: string) => Store<T>;
  logger?: (...args: any[]) => void;
  isDev?: boolean;
};

export default class Bot extends Telegraf<BotContext> {
  private webhook?: Awaited<ReturnType<typeof Telegraf.prototype.createWebhook>>;
  private botServices?: {
    translation: Translation;
    conversation: Conversation;
    midjourney: Midjourney;
    ffmpeg: typeof ffmpeg;
  };

  constructor(token: string) {
    super(token, { 
      telegram: { webhookReply: false },
      handlerTimeout: 1000 * 60 * 10
    });
  }

  get services() {
    return this.botServices;
  }

  handle(...args: Parameters<Awaited<ReturnType<typeof Telegraf.prototype.createWebhook>>>) {
    return this.webhook ? this.webhook(...args) : args[2]?.();
  }

  async run(options: BotOptions) {
    const { DISCORD_SERVER_ID, DISCORD_CHANNEL_ID, DISCORD_SALAI_TOKEN } = process.env;
    const {
      domain,
      path,
      createStore = <T>() => new MemorySessionStore() as unknown as Store<T>,
      logger = console.log,
      isDev = true
    } = options;

    this.botInfo = await this.telegram.getMe();
    this.botServices = {
      translation: await Translation.create(),
      conversation: new Conversation(),
      ffmpeg: ffmpeg,
      midjourney: new Midjourney({
        ServerId: DISCORD_SERVER_ID!,
        ChannelId: DISCORD_CHANNEL_ID!,
        SalaiToken: DISCORD_SALAI_TOKEN!,
        Debug: isDev
      })
    };

    await this.botServices.midjourney.init();

    for (const lang of this.botServices.translation.langs) {
      const $t = this.botServices.translation.get(lang);
      await this.telegram.setMyCommands(
        definitions.map((cmd) => ({ ...cmd, description: $t(cmd.description) })),
        { language_code: lang }
      );
    }
  
    const stage = new Scenes.Stage<BotContext>(
      [dialogScene, settingsScene],
      { default: DIALOG_SCENE_ID }
    );

    this.use(
      isDev ? Telegraf.log(logger) : Telegraf.passThru(),
      session({
        store: createStore(this.botInfo.username, "session"),
        defaultSession: () => ({ __scenes: { state: {} } })
      }),
      services(this),
      stage.middleware()
    );

    this.webhook = await this.createWebhook({
      secret_token: this.telegram.token.replace(":", "-"),
      domain,
      path
    });
  }
}