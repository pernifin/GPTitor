import { default as balance } from "./balance";
import { default as image } from "./image";

import type { BotContext } from "../bot";

type Command = {
  name: string,
  description: string,
  public?: boolean,
  action?: (ctx: BotContext) => Promise<void>,
};

export default [
  {
    name: "start",
    description: "Run bot within current chat",
    public: true,
  },
  {
    name: "settings",
    description: "Bot configuration menu for current chat",
    public: true,
  },
  {
    name: "balance",
    description: "Get your tokens balance",
    public: true,
    action: balance
  },
  {
    name: "image",
    description: "Generate image from prompt (using DALL-E)",
    action: image
  }
] as Command[];