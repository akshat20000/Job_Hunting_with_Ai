import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// Resolve environment variables by searching both local and parent directories
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  BRAIN_ENGINE_URL: z.string().url().default('http://localhost:8000'),
  GROQ_API_KEY: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  NOTIFY_TO_EMAIL: z.string().email(),
  LINKEDIN_AUTOMATION_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === 'true')
    .or(z.boolean())
    .default(false),
  AUTO_APPLY_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === 'true')
    .or(z.boolean())
    .default(false),  
  PLAYWRIGHT_HEADLESS: z
    .string()
    .transform((val) => val.toLowerCase() === 'true')
    .or(z.boolean())
    .default(true),
  STORAGE_DIR: z.string().default(path.join(process.cwd(), 'storage')),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
