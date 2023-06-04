import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import { Readable } from "stream";
import d from 'debug';

import config from '../config';
import type { BotContext } from '../bot';

const debug = d('bot:openai');

export default class OpenAI {
  api: OpenAIApi;

  constructor (key: string, ctx: BotContext) {
    this.api = new OpenAIApi(new Configuration({ apiKey: key }));
  }

  async createChatCompletion(ctx: BotContext, messages: ChatCompletionRequestMessage[]) {
    const settings = ctx.settings.current;
    const request = { 
      messages,
      model: settings.model,
      temperature: settings.temperature,
      n: settings.completions,
      max_tokens: settings.maxTokens
    };

    try {
      debug('createChatCompletion %o', request);
      const { data } = await this.api.createChatCompletion(request);

      debug('Chat completion result %o', data);

      if (data.usage?.total_tokens) {
        ctx.quota.consume(settings.model, data.usage.total_tokens / 1000);
      }
    
      return data.choices;
    } catch (error) {
      debug('createChatCompletion error', (error as Error).message);
      return [];
    }
  }

  async createImage(ctx: BotContext, prompt: string) {
    const response = await this.api.createImage({ prompt });
    ctx.quota.consume('dall-e', 2);
  
    return response.data.data[0];
  }

  async transcribeAudio(audio: Readable) {
    const { data: { text } } = await this.api.createTranscription(audio as never, "whisper-1");

    return text; 
  }

  async getEligibileModels() {
    const response = await this.api.listEngines();
    return response.data.data
      .filter(engine => engine.ready && Object.keys(config.models).includes(engine.id))
      .map(engine => engine.id);
  }
}
