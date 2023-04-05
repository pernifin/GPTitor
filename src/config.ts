export const tg = {
  botName: process.env.NODE_ENV === 'production' ? 'GPTitorBot' : 'StageGPTitorBot', 
  options: {
    polling: true
  },
};

export const ai = {
  defaultSettings: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    systemMessage: '',
  },
}