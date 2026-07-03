import { env } from './env.js';

export const aiConfig = {
  brainEngineUrl: env.BRAIN_ENGINE_URL,
  groqApiKey: env.GROQ_API_KEY,
};

export default aiConfig;
