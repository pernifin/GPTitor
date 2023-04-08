export default {
  whitelistModels: ['gpt-4', 'gpt-3.5-turbo', 'text-davinci-003', 'text-ada-001'],
  creativityLevels: { '0.0': 'None', '0.3': 'Deterministic', '0.7': 'Moderate', '1.1': 'High', '1.6': 'Extreme' },
  systemMessage: [
    'Your are an AI assistant.',
    'You can answer questions and help people.',
    'When being asked to generate a piece of code always wraps it in three backticks (`).'
  ].join('\n'),
  chatCompletionSettings: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    n: 1,
  },
};
