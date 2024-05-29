import OpenAIApi, { toFile } from "openai";
import d from "debug";

import config, { type ModelName } from "../config";
import type { BotContext } from "../bot";

const debug = d("bot:openai");

export default class OpenAI {
  api: OpenAIApi;

  constructor (key: string, private ctx: BotContext) {
    this.api = new OpenAIApi({ apiKey: key });
  }

  async createChatCompletion(messages: OpenAIApi.ChatCompletionMessageParam[]) {
    const settings = this.ctx.settings.current;
    const request = { 
      messages,
      model: settings.model,
      temperature: settings.temperature,
      n: settings.completions,
      // max_tokens: settings.maxTokens,
      tools: config.tools,
    };

    try {
      debug(`createChatCompletion request: ${JSON.stringify(request, null, 2)}`);
      const { choices, usage } = await this.api.chat.completions.create(request);
      debug(`createChatCompletion response: ${JSON.stringify(choices, null, 2)}`);

      if (usage?.total_tokens) {
        this.ctx.quota.consume(settings.model, usage.total_tokens / 1000);
      }

      return choices;
    } catch (error) {
      console.error(`createChatCompletion error: ${JSON.stringify(error, null, 2)}`);

      const message = (error as Error)?.message;
      return message
        ? [
          {
            message: { content: message, role: "system" },
            finish_reason: "error",
          } as unknown as OpenAIApi.ChatCompletion.Choice
        ]
        : [];
    }
  }

  async generateImage(prompt: string) {
    const { data } = await this.api.images.generate({
      prompt,
      model: "dall-e-3",
      quality: 'hd',
      response_format: 'url',
      size: '1024x1024',
    });

    return data[0];
  }

  async transcribeAudio(buffer: Buffer, duration: number) {
    const { text } = await this.api.audio.transcriptions.create({
      file: await toFile(buffer, "conversation.mp3", { type: "audio/mpeg" }),
      model: "whisper-1",
    });

    this.ctx.quota.consume("whisper-1", duration / 60);

    return text; 
  }

  async translateMessage(text: string) {
    const settings = this.ctx.settings.current;
    const messages: OpenAIApi.ChatCompletionMessageParam[] = [
      { role: "system", content: config.translationRequest },
      { role: "user", content: text }
    ];

    const { choices, usage } = await this.api.chat.completions.create({ 
      messages,
      model: settings.model,
      temperature: 0
    });

    if (usage?.total_tokens) {
      this.ctx.quota.consume(settings.model, usage.total_tokens / 1000);
    }

    return choices[0].message?.content ?? "";
  }

  async antispamPrompt() {
    const { choices } = await this.api.chat.completions.create({ 
      messages: [{ role: "system", content: this.ctx.$t("antispam.system") }],
      model: this.ctx.settings.current.model,
      temperature: 1.1
    });

    return choices[0].message?.content ?? "";
  }

  async checkAntispam(question: string, answer: string) {
    const prompt: OpenAIApi.ChatCompletionMessageParam[] = [
      { role: "system", content: this.ctx.$t("antispam.system") },
      { role: "assistant", content: question },
      { role: "user", content: answer }
    ];

    const { choices } = await this.api.chat.completions.create({ 
      messages: prompt,
      model: this.ctx.settings.current.model,
      temperature: 0
    });

    return choices[0].message?.content?.toLowerCase() === "yes";
  }

  async getModels(returnAll = false) {
    const response = await this.api.models.list();
    return response.data
      .filter(engine => returnAll || config.models[engine.id as ModelName])
      .map(engine => engine.id);
  }
}
