import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pgSchema = env.PG_SCHEMA;

export const pgPool = new Pool({
  connectionString: env.PG_CONNECTION_STRING,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: env.PG_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.PG_CONNECT_TIMEOUT_MS,
});

pgPool.on('error', (error) => {
  console.error('[pg-pool-error]', error);
});

export function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function parseDatabaseName(connectionString) {
  try {
    const parsed = new URL(connectionString);
    return parsed.pathname.replace(/^\/+/, '') || null;
  } catch {
    return null;
  }
}

export const pgInfo = {
  schema: pgSchema,
  database: parseDatabaseName(env.PG_CONNECTION_STRING),
};

export async function closePgPool() {
  await pgPool.end();
}
