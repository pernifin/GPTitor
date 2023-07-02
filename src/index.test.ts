import express from "express";

import Bot from "./bot";

const app = express();
const bot = new Bot("test");

bot.telegram.callApi = function(method, payload): Promise<any> {
  console.log(method, payload);
  return Promise.resolve(true);
}

app.post("/bot", async (request, response, next) => {
  await bot.handle(request, response, next);
  response.status(200).json({ success: true });
});

app.listen(3000, async () => {
  await bot.run({
    domain: "localhost",
    path: "/bot",
  });

  console.log("Server started on port 3000");
});