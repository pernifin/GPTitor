import { createClient } from "redis";

export default class Datastore {
  private static client: ReturnType<typeof createClient>;

  static async init() {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is not set");
    }

    this.client = createClient({ url: process.env.REDIS_URL });
    await this.client.connect();
  }

  constructor(private collection: string) {
    if (!Datastore.client) {
      throw new Error("Datastore is not initialized");
    }
  }

  async get<T>(key: string) {
    const data = await Datastore.client.hGet(this.collection, key);
    return data ? JSON.parse(data) as T : undefined;
  }

  async set<T>(key: string, value: T) {
    await Datastore.client.hSet(this.collection, key, JSON.stringify(value));
  }

  async delete(key: string) {
    await Datastore.client.hDel(this.collection, key);
  }
}
