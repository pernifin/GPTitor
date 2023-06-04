type ModelName = string;

export default {
  models: {
    'gpt-3.5-turbo': 0.2,
    'gpt-4': 6,
    'dall-e': 2,
  } as Record<ModelName, number>,
  creativityLevels: { '0.0': 'None', '0.3': 'Deterministic', '0.7': 'Moderate', '1.1': 'High', '1.6': 'Extreme' },
  systemMessage: [
    'Always wrap every multiline block of code that you generate in <pre> tag, inline code should be wrapped in <code> tag, remove leading line breaks and trailing spaces, replace markdown style with html tags',
    'If you are asked to generate an image, then instead of a negative response, transform the user\'s request into a concise prompt in English, add "image:" in front of it and return it as a response'
  ].join('\n'),
  maxCompletions: 5,
  defaultSettings: {
    model: 'gpt-3.5-turbo' as ModelName,
    temperature: 0.7,
    completions: 1,
    persist: false,
    maxTokens: 2048
  },
  userQuota: {
    startTokens: 10000,
    dailyTokens: 1000,
    multiplier: 100, // We use 0.01 cent as a bot token
    exceedMessage: 'Вы превысили лимит запросов на сегодня. Попробуйте завтра снова.'
  },
  greeting: [
    'Здравствуйте! Я - AI-ассистент, созданный для того, чтобы отвечать на ваши вопросы и помогать вам.',
    'Если у вас возникнут вопросы или вам нужна помощь, не стесняйтесь обращаться!'
  ].join('\n'),
};
