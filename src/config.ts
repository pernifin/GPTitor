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
  modes: { "0.1": "Strict", "0.6": "Flexible", "1.1": "Creative", "1.6": "Extreme" },
  systemMessage: [
    // "Always wrap every multiline block of code that you generate in <pre> tag, inline code should be wrapped in <code> tag, remove leading line breaks and trailing spaces, replace markdown style with html tags",
    "Wrap every piece of code that you generate in three backticks (`).",
    // "If you are asked to generate an image, then instead of a negative response, transform the user\"s request into a concise prompt in English, add 'image:' in front of it and return it as a response"
  ].join("\n"),
  maxCompletions: 5,
  defaultSettings: {
    model: "gpt-3.5-turbo-16k-0613" as ModelName,
    temperature: 0.6,
    completions: 1,
    maxTokens: 4096,
    functions: [
      {
        name: "generateImage",
        description: "Generate an image from a user's prompt",
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt string that describes the image to be generated"
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
    ]
  },
  userQuota: {
    startTokens: 10000,
    dailyTokens: 1000,
    multiplier: 100, // We use 0.01 cent as a bot token
    exceedMessage: "Вы превысили лимит запросов на сегодня. Попробуйте завтра снова."
  },
  greeting: [
    "Здравствуйте! Я - AI-ассистент, созданный для того, чтобы отвечать на ваши вопросы и помогать вам.",
    "Если у вас возникнут вопросы или вам нужна помощь, не стесняйтесь обращаться!"
  ].join("\n"),
  langs: {
    default: "en",
    supported: ["en", "ru"] as const
  }
};

export default config;