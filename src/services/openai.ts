import { Configuration, OpenAIApi, ChatCompletionRequestMessage, CreateChatCompletionResponseChoicesInner } from "openai";
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

  async createChatCompletion(messages: ChatCompletionRequestMessage[])
    : Promise<CreateChatCompletionResponseChoicesInner[]> 
  {
    const settings = this.ctx.settings.current;
    const request = { 
      messages,
      model: settings.model,
      temperature: settings.temperature,
      n: settings.completions,
      // max_tokens: settings.maxTokens
      functions: config.functions
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

      const message = (error as any).response?.data?.error?.message;
      return message
        ? [{ message: { content: message, role: "system" }, finish_reason: "error" }]
        : [];
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

  async translateMessage(text: string) {
    const settings = this.ctx.settings.current;
    const messages: ChatCompletionRequestMessage[] = [
      { role: "system", content: config.translationRequest },
      { role: "user", content: text }
    ];

    debug("translate message %o", messages);
    const { data } = await this.api.createChatCompletion({ 
      messages,
      model: settings.model,
      temperature: 0
    });

    debug("Translation result %o", data);

    if (data.usage?.total_tokens) {
      this.ctx.quota.consume(settings.model, data.usage.total_tokens / 1000);
    }

    return data.choices[0].message?.content ?? "";
  }

  async antispamPrompt() {
    const { data } = await this.api.createChatCompletion({ 
      messages: [{ role: "system", content: this.ctx.$t("antispam.system") }],
      model: this.ctx.settings.current.model,
      temperature: 1.1
    });

    debug("Antispam prompt %o", data.choices[0]);

    return data.choices[0].message?.content ?? "";
  }

  async checkAntispam(question: string, answer: string) {
    const prompt: ChatCompletionRequestMessage[] = [
      { role: "system", content: this.ctx.$t("antispam.system") },
      { role: "assistant", content: question },
      { role: "user", content: answer }
    ];

    const { data } = await this.api.createChatCompletion({ 
      messages: prompt,
      model: this.ctx.settings.current.model,
      temperature: 0
    });

    debug("Antispam check %o", data.choices[0]);
    return data.choices[0].message?.content?.toLowerCase() === "yes";
  }

  async getModels(returnAll = false) {
    const response = await this.api.listEngines();
    return response.data.data
      .filter(engine => engine.ready && (returnAll || config.models[engine.id as ModelName]))
      .map(engine => engine.id);
  }
}
