const prices = {
  "gpt-4o": 1.5,
  "gpt-4-vision-preview": 3,
  "whisper-1": 0.6,
  "dall-e-3": 4,
} as const;

export type ModelName = keyof typeof prices;

const config = {
  models: {
    "gpt-4o": "GPT-4o"
  } as Record<ModelName, string>,
  prices,
  modes: { "0.1": "Strict", "0.7": "Flexible", "1.2": "Creative", "1.7": "Extreme" },
  systemMessage: [
    "You are an AI assistant who has access to all the knowledge of mankind.",
    "The user asks you to explain something.",
    "Always politely and briefly answer his questions.",
    "Do not repeat user's question at the start of the answer.",
    "If the answer requires clarification, ask a question.",
    "Communicate in a friendly tone, but always short and to the point.",
    "Generate code only if the user explicitly requested it, or if the code is an integral part of the explanation.",
    "Always wrap code blocks with three backticks (`)",
    "Use MarkdownV2 style for formatting messages.",
    "To make bold text use single *asterisks*, to make italic use single _underscore_.",
    "Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous.",
  ].join("\n"),
  translationRequest: "Translate following user's message into English",
  maxCompletions: 5,
  defaultSettings: {
    model: "gpt-4o" as ModelName,
    temperature: 0.7,
    completions: 1,
    maxTokens: 4096
  },
  tools: [
    {
      type: "function" as const,
      function: {
        name: "generateImage",
        description: "Generate an image from a user's prompt. Can be called only when user explicitly asks for an image",
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Clear and concise prompt string in English language without verbs that describes the image to be generated"
            }
          },
          required: ["prompt"]
        },
      }
    },
    // {
    //   name: "describeImage",
    //   description: "Describe in human readable format what is depicted on provided image",
    //   parameters: {
    //     type: "object",
    //     properties: {}
    //   }
    // }
  ],
  userQuota: {
    startTokens: 10000,
    dailyTokens: 1000,
    multiplier: 100, // We use 0.01 cent as a bot token
  },
  defaultLang: "en" as const,
  antispam: {
    requests: {
      minute: 3,
      hour: 10,
      day: 30
    }
  }
};

export default config;