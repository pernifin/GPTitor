import openai, { getSettings } from '../services/openai.js';
import { ai } from '../config.js';

export default async function(msg, question) {
  const settings = getSettings(msg.chat.id);

  const response = await openai.createChatCompletion({
    ...settings,
    messages: [
      ai.systemMessage
        ? { role: 'system', content: ai.systemMessage }
        : null,
      { role: 'user', content: question, /* user: msg.from.first_name */ },
    ].filter(Boolean)
  });

  return response.data.choices
    .map(choice => choice.message.content)
    .join('\n');
}