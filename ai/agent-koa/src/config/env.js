import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const mcpServerSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).optional().default([]),
  cwd: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(true),
  env: z.record(z.string(), z.string()).optional().default({}),
});

const mcpServersJsonSchema = z.string().default('[]').transform((raw, ctx) => {
  try {
    const parsed = JSON.parse(raw);
    const validated = z.array(mcpServerSchema).safeParse(parsed);
    if (!validated.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validated.error.issues.map((issue) => issue.message).join('; '),
      });
      return [];
    }
    return validated.data;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'MCP_SERVERS_JSON must be valid JSON array',
    });
    return [];
  }
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  AGENT_API_TOKEN: z.string().optional(),
  AGENT_MAX_ITERATIONS: z.coerce.number().int().positive().default(8),
  AGENT_TOOL_MAX_CALLS: z.coerce.number().int().positive().default(12),
  AGENT_TOOL_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  AGENT_CONTEXT_ROUNDS: z.coerce.number().int().min(2).max(12).default(6),
  TOOL_ROUTER_TOP_K: z.coerce.number().int().positive().default(3),
  TOOL_ROUTER_EMBED_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  OLLAMA_BASE_URL: z.string().url().optional().default('http://127.0.0.1:11434'),
  OLLAMA_EMBED_MODEL: z.string().min(1).default('nomic-embed-text'),
  SQLITE_PATH: z.string().min(1).default('./data/agent-checkpoints.sqlite'),
  MCP_SERVERS_JSON: mcpServersJsonSchema,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment variables: ${errors}`);
}

export const env = {
  ...parsed.data,
  MCP_SERVERS: parsed.data.MCP_SERVERS_JSON,
};
