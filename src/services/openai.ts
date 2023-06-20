import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { Readable } from "stream";
import d from "debug";

import config, { type ModelName } from "../config";
import type { BotContext } from "../bot";

const debug = d("bot:openai");

export default class OpenAI {
  api: OpenAIApi;

  constructor (key: string, private ctx: BotContext) {
    this.api = new OpenAIApi(new Configuration({ apiKey: key }));
  }

  async createChatCompletion(messages: ChatCompletionRequestMessage[]) {
    const settings = this.ctx.settings.current;
    const request = { 
      messages,
      model: settings.model,
      temperature: settings.temperature,
      n: settings.completions,
      // max_tokens: settings.maxTokens
      functions: settings.functions
    };

    try {
      debug("createChatCompletion %o", request);
      const { data } = await this.api.createChatCompletion(request);

      debug("Chat completion result %o", data);

      if (data.usage?.total_tokens) {
        this.ctx.quota.consume(settings.model, data.usage.total_tokens / 1000);
      }
    
      return data.choices;
    } catch (error) {
      debug("createChatCompletion error", (error as any).response?.data ?? (error as Error).message);
      return [];
    }
  }

  async transcribeAudio(buffer: Buffer, duration: number) {
    const audio = Readable.from(buffer);
    // @ts-expect-error path does not exist
    audio.path = "conversation.mp3";

    const { data: { text } } = await this.api.createTranscription(audio as unknown as File, "whisper-1");
    this.ctx.quota.consume("whisper-1", duration / 60);

    return text; 
  }

  async getModels(returnAll = false) {
    const response = await this.api.listEngines();
    return response.data.data
      .filter(engine => engine.ready && (returnAll || config.models[engine.id as ModelName]))
      .map(engine => engine.id);
  }
}
