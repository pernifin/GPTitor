import { Telegraf, Context, Scenes, session } from "telegraf";
import { Update, CallbackQuery } from 'typegram';
import ffmpeg from "fluent-ffmpeg";

import { definitions } from "./scenes/dialog/commands";
import settingsScene from "./scenes/settings";
import antispamScene from "./scenes/antispam";
import dialogScene, { DIALOG_SCENE_ID } from "./scenes/dialog";
import {
  services,
  Datastore, OpenAI, Quota, Settings, Translation, Conversation, Midjourney,
  type UserQuota, type ChatSettings, type Translator
} from "./services";

export type SceneState = Scenes.SceneSessionData & {
  state: Record<string, any>;
};

export type BotSession = Scenes.SceneSession<SceneState> & {
  userQuota?: UserQuota;
  chatSettings?: ChatSettings;
  antispamPrompt?: string;
};

export type BotUpdate = Update.MessageUpdate & Update.CallbackQueryUpdate<CallbackQuery.DataQuery>;

export type BotContext<U extends Update = Update> = Context & {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, SceneState>;
  update: U;

  openai: OpenAI;
  quota: Quota;
  settings: Settings;
  conversation: Conversation;
  midjourney: Midjourney;
  ffmpeg: typeof ffmpeg;
  timestamp: number;
  host: string;
  $t: Translator;
};

export type BotOptions = {
  domain: string,
  path: string,
  logger?: (...args: any[]) => void;
  isDev?: boolean;
};

export default class Bot extends Telegraf<BotContext> {
  private webhook?: Awaited<ReturnType<typeof Telegraf.prototype.createWebhook>>;
  public host?: string;
  private botServices?: {
    translation: Translation;
    conversation: Conversation;
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
      logger = console.log,
      isDev = true
    } = options;

    this.botInfo = await this.telegram.getMe();
    this.host = `https://${domain}`;
    this.botServices = {
      translation: new Translation(),
      conversation: new Conversation(),
      ffmpeg: ffmpeg
    };

    await Datastore.init();
    // await Midjourney.init({
    //   ServerId: DISCORD_SERVER_ID!,
    //   ChannelId: DISCORD_CHANNEL_ID!,
    //   SalaiToken: DISCORD_SALAI_TOKEN!,
    //   Debug: isDev
    // });

    for (const lang of this.botServices.translation.supportedLangs) {
      const $t = this.botServices.translation.getTranslator(lang);
      await this.telegram.setMyCommands(
        definitions.map((cmd) => ({ ...cmd, description: $t(cmd.description) })),
        { language_code: lang }
      );
    }

    const stage = new Scenes.Stage<BotContext>(
      [dialogScene, settingsScene, antispamScene],
      { default: DIALOG_SCENE_ID }
    );

    this.use(
      isDev ? Telegraf.log(logger) : Telegraf.passThru(),
      session({
        store: new Datastore("session"),
        defaultSession: () => ({ __scenes: { state: {} } })
      }),
      services(this),
      stage.middleware()
    );

    this.webhook = await this.createWebhook({
      domain,
      path,
      allowed_updates: ["message", "callback_query"],
      secret_token: Math.floor(Date.now() * Math.random() * 1000).toString()
    });
  }
}
