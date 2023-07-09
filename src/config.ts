const prices = {
  "gpt-3.5-turbo-16k-0613": 0.4,
  "gpt-4-0613": 6,
  "whisper-1": 0.6
} as const;

export type ModelName = keyof typeof prices;

const config = {
  models: {
    "gpt-3.5-turbo-16k-0613": "GPT-3.5 Turbo",
    "gpt-4-0613": "GPT-4"
  } as Record<ModelName, string>,
  prices,
  modes: { "0.1": "Strict", "0.7": "Flexible", "1.2": "Creative", "1.7": "Extreme" },
  systemMessage: [
    "You are an AI assistant who has access to all the knowledge of mankind. The user asks you to explain something. Always politely and briefly answer his questions. If the answer requires clarification, ask a question. Communicate in a friendly tone, but always short and to the point.",
    "Generate code only if the user explicitly requested it, or if the code is an integral part of the explanation.",
    "Always wrap code blocks with three backticks (`)"
  ].join("\n"),
  translationRequest: "Translate following user's message into English",
  maxCompletions: 5,
  defaultSettings: {
    model: "gpt-3.5-turbo-16k-0613" as ModelName,
    temperature: 0.7,
    completions: 1,
    maxTokens: 4096
  },
  functions: [
    {
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
    },
    {
      name: "describeImage",
      description: "Describe in human readable format what is depicted on provided image",
      parameters: {
        type: "object",
        properties: {}
      }
    }
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