import openai from '../services/openai.js';

export default async function() {
  const response = await openai.listEngines();

  return response.data.data
    .filter(engine => engine.ready)
    .map(engine => engine.id)
    .join('\n');
}