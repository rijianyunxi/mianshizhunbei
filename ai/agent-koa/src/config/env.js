import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  AGENT_API_TOKEN: z.string().optional(),
  AGENT_MAX_HISTORY: z.coerce.number().int().positive().default(24),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment variables: ${errors}`);
}

export const env = parsed.data;
