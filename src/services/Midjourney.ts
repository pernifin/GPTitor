import { Midjourney as MJClient, type MJMessage } from "midjourney";
import sharp from "sharp";
import d from "debug";

import { type BotContext } from "../bot";

const debug = d("bot:midjourney");

type MidjourneyConfig = {
  ServerId: string,
  ChannelId: string,
  SalaiToken: string,
  Debug: boolean
};

type GenerationType = "generation" | "variation" | "upscale";
export type Generation = {
  type: GenerationType;
  prompt: string;
  hash: string;
  indexHashes: string[];
  request: {
    msgId: string;
    hash: string;
    flags: number;
  };
};

export type GeneratedImage = Generation & {
  image: string | { source: Buffer };
}

export default class Midjourney {
  private client: MJClient;
  private gens: Record<string, Generation> = {};

  constructor(config: MidjourneyConfig, private ctx: BotContext) {
    this.client = new MJClient({
      ...config,
      Ws: true
    });

    this.gens = ctx.session.imageGenerations ??= {};
  }

  async init() {
    await this.client.Connect();
  }

  close() {
    this.client.Close();
  }

  getPrompt(hash: string) {
    const [generationHash] = hash.split("-");
    return this.gens[generationHash]?.prompt;
  }

  async createGeneration(image: MJMessage, prompt: string, type: GenerationType): Promise<GeneratedImage> {
    const hash = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    this.gens[hash] = {
      type,
      prompt,
      hash,
      indexHashes: type !== "upscale" ? Array.from({ length: 4 }, (n, i) => `${hash}-${i + 1}`) : [],
      request: {
        msgId: image.id!,
        hash: image.hash!,
        flags: image.flags
      }
    };

    return {
      image: await this.adjustImage(image.uri),
      ...this.gens[hash]
    };
  }

  async generate(prompt: string) {
    const image = await this.client.Imagine(prompt);
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "generation");
  }

  async upscale(hash: string) {
    const { prompt, ...request } = this.buildRequest(hash);
    const image = await this.client.Upscale(request);
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "upscale");
  }

  async outpaint(hash: string, level: "2x" | "1.5x" | "high" | "low") {
    const { prompt, ...request } = this.buildRequest(hash);
    const image = await this.client.ZoomOut({ level, ...request });
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "generation");
  }

  async variate(hash: string) {
    const { prompt, ...request } = this.buildRequest(hash);
    const image = await this.client.Variation(request);
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "variation");
  }

  async describe(imageUrl: string) {
    return this.client.Describe(imageUrl).then((result) => result?.descriptions);
  }

  async simplify(prompt: string) {
    return this.client.Shorten(prompt);
  }

  private async adjustImage(imageUrl: string) {
    const length = await fetch(imageUrl, { method: "HEAD" })
      .then((response) => +response.headers.get("content-length")!);

    if (length > 1024 * 1024 * 5) {
      debug("Image is more than 5MB, resizing");
      const buffer = await fetch(imageUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => sharp(buffer).png({ quality: 100 }).toBuffer());

      return { source: buffer };
    }

    return imageUrl;
  }

  private buildRequest(hash: string) {
    const [generationHash, index] = hash.split("-");
    if (!this.gens[generationHash]) {
      throw new Error(this.ctx.$t("error.image-not-found"));
    }

    const { request, prompt } = this.gens[generationHash];
    return {
      index: +index as 1 | 2 | 3 | 4,
      ...request,
      prompt,
    };
  }
}