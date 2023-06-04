import admin from "firebase-admin";

const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://gptitor-default-rtdb.europe-west1.firebasedatabase.app"
});
export const db = admin.database(app);

export const createStore = <T>(prefix = "") => {
  prefix = `${prefix}${prefix.endsWith("/") ? "" : "/"}`;

  return {
    async get(key: string) {
      return db.ref(prefix + key).get().then((snapshot) => snapshot.val() as T ?? undefined);
    },
    async set(key: string, value: T) {
      await db.ref(prefix + key).set(value);
    },
    delete: async (key: string) => {
      await db.ref(prefix + key).remove();
    }
  };
};
