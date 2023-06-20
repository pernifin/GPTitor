import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL!);

export const createStore = <T>(botname: string, collectionName: string) => {
  const database = client.db(botname);
  const collection = database.collection(collectionName);

  return {
    async get(key: string) {
      const data = await collection.findOne({ key });
      return data?.value ? JSON.parse(data.value) as T : undefined;
    },
    async set(key: string, value: T) {
      await collection.updateOne({ key }, { $set: { key, value: JSON.stringify(value) } }, { upsert: true });
    },
    delete: async (key: string) => {
      await collection.deleteOne({ key });
    }
  };
};
