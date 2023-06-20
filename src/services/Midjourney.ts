import { Midjourney as MJClient, type MJMessage } from "midjourney";

type MidjourneyConfig = {
  ServerId: string,
  ChannelId: string,
  SalaiToken: string,
  Debug: boolean
};

type MidjourneyImage = {
  imageUrl: string,
  msgId: string,
  msgHash: string,
  prompt: string,
};

export default class Midjourney {
  private client: MJClient;
  private generated: Record<string, MidjourneyImage> = {};

  constructor(config: MidjourneyConfig) {
    this.client = new MJClient({
      ...config,
      Ws: true
    });
  }

  private saveResult(image: MJMessage, prompt: string) {
    const index = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    this.generated[index] = {
      imageUrl: image.uri,
      msgId: image.id!,
      msgHash: image.hash!,
      prompt
    };

    return index;
  }

  getResult(hash: string) {
    return this.generated[hash];
  }

  async init() {
    await this.client.Connect();
  }

  async generate(prompt: string) {
    const image = await this.client.Imagine(prompt);

    return image
      ? { url: image.uri, hash: this.saveResult(image, prompt) }
      : null;
  }

  async variate(hash: string, index: number) {
    if (!this.generated[hash]) {
      return null;
    }

    const { msgId, msgHash, prompt } = this.generated[hash];
    const image = await this.client.Variation({
      index: index as 1 | 2 | 3 | 4,
      msgId,
      hash: msgHash,
      flags: 0
    });

    return image
      ? { url: image.uri, hash: this.saveResult(image, prompt) }
      : null;
  }

  async describe(imageUrl: string) {
    return this.client.Describe(imageUrl);
  }
}