import { Midjourney as MJClient, type MJMessage } from "midjourney";
import sharp from "sharp";
import d from "debug";

import { type BotContext } from "../bot";
import type Datastore from "./Datastore";

const debug = d("bot:midjourney");
const noop = () => {};

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
  private static client: MJClient;
  static async init(config: MidjourneyConfig) {
    this.client = new MJClient({
      ...config,
      Ws: true
    });

    await this.client.Connect();
  }

  static close() {
    this.client.Close();
  }

  constructor(private ctx: BotContext, private store: Datastore) {
    if (!Midjourney.client) {
      throw new Error("Midjourney is not initialized");
    }
  }

  async getPrompt(hash: string) {
    const [generationHash] = hash.split("-");
    return (await this.store.get<Generation>(generationHash))?.prompt;
  }

  async hasUpscale(hash: string) {
    const [generationHash] = hash.split("-");
    const gen = await this.store.get<Generation>(generationHash);

    return gen?.type === "upscale";
  }

  async createGeneration(msg: MJMessage, prompt: string, type: GenerationType, onFinish = noop) {
    const hash = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const gen = {
      type,
      prompt,
      hash,
      indexHashes: type !== "upscale" ? Array.from({ length: 4 }, (n, i) => `${hash}-${i + 1}`) : [],
      request: {
        msgId: msg.id!,
        hash: msg.hash!,
        flags: msg.flags
      }
    };

    await this.store.set(hash, gen);
    const image = await this.adjustImage(msg.uri);

    onFinish();
    return { image, ...gen } as GeneratedImage;
  }

  async generate(prompt: string, tracker: (progress: number) => void = noop) {
    const image = await Midjourney.client.Imagine(prompt, this.getLoader(tracker));
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }

    return this.createGeneration(image, prompt, "generation", () => tracker(100));
  }

  async upscale(hash: string, tracker: (progress: number) => void = noop) {
    const { prompt, ...request } = await this.buildRequest(hash, tracker);
    const image = await Midjourney.client.Upscale(request);
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "upscale", () => tracker(100));
  }

  async outpaint(hash: string, level: "2x" | "1.5x" | "high" | "low", tracker: (progress: number) => void = noop) {
    const { prompt, ...request } = await this.buildRequest(hash, tracker);
    const image = await Midjourney.client.ZoomOut({ level, ...request });
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "generation", () => tracker(100));
  }

  async variate(hash: string, tracker: (progress: number) => void = noop) {
    const { prompt, ...request } = await this.buildRequest(hash, tracker);
    const image = await Midjourney.client.Variation(request);
    if (!image) {
      throw new Error(this.ctx.$t("error.generate-image-failed"));
    }
    return this.createGeneration(image, prompt, "variation", () => tracker(100));
  }

  async describe(imageUrl: string) {
    return Midjourney.client.Describe(imageUrl).then((result) => result?.descriptions);
  }

  async simplify(prompt: string) {
    return Midjourney.client.Shorten(prompt);
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

  private async buildRequest(hash: string, tracker: (progress: number) => void) {
    const [generationHash, index] = hash.split("-");
    const generation = await this.store.get<Generation>(generationHash);
    if (!generation) {
      throw new Error(this.ctx.$t("error.image-not-found"));
    }

    return {
      loader: this.getLoader(tracker),
      index: +index as 1 | 2 | 3 | 4,
      prompt: generation.prompt,
      ...generation.request
    };
  }

  private getLoader(tracker: (progress: number) => void) {
    return (uri: string, progress: string) => tracker(parseInt(progress, 10));
  }
}