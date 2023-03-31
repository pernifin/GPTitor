import openai from '../services/openai.js';

export default async function() {
  const response = await openai.listEngines();

  console.log(response.data.data);

  return response.data.data
    .filter(engine => engine.ready)
    .map(engine => engine.id)
    .join('\n');
}