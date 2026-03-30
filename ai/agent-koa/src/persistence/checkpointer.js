import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { pgPool, pgSchema, quoteIdentifier } from './pg.js';

const schemaSql = quoteIdentifier(pgSchema);

export const checkpointSaver = new PostgresSaver(pgPool, undefined, { schema: pgSchema });

let setupPromise = null;

export async function initCheckpointer() {
  if (!setupPromise) {
    setupPromise = checkpointSaver.setup();
  }
  await setupPromise;
}

export async function clearThreadCheckpoints(threadId) {
  const normalizedThreadId = String(threadId || '').trim();
  if (!normalizedThreadId) return;

  await initCheckpointer();

  await pgPool.query(`DELETE FROM ${schemaSql}.checkpoint_writes WHERE thread_id = $1`, [normalizedThreadId]);
  await pgPool.query(`DELETE FROM ${schemaSql}.checkpoint_blobs WHERE thread_id = $1`, [normalizedThreadId]);
  await pgPool.query(`DELETE FROM ${schemaSql}.checkpoints WHERE thread_id = $1`, [normalizedThreadId]);
}
