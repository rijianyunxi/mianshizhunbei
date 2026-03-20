import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { env } from '../config/env.js';

export const sqlitePath = resolve(process.cwd(), env.SQLITE_PATH);
mkdirSync(dirname(sqlitePath), { recursive: true });

export const checkpointSaver = SqliteSaver.fromConnString(sqlitePath);

const maintenanceDb = new Database(sqlitePath);
maintenanceDb.pragma('journal_mode = WAL');

const deleteWritesByThreadStmt = maintenanceDb.prepare('DELETE FROM writes WHERE thread_id = ?');
const deleteCheckpointsByThreadStmt = maintenanceDb.prepare('DELETE FROM checkpoints WHERE thread_id = ?');
const clearThreadCheckpointTx = maintenanceDb.transaction((threadId) => {
  deleteWritesByThreadStmt.run(threadId);
  deleteCheckpointsByThreadStmt.run(threadId);
});

export function clearThreadCheckpoints(threadId) {
  const normalizedThreadId = String(threadId || '').trim();
  if (!normalizedThreadId) return;
  clearThreadCheckpointTx(normalizedThreadId);
}
