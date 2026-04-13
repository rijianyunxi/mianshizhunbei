import { MemorySaver, WRITES_IDX_MAP, copyCheckpoint, getCheckpointId } from '@langchain/langgraph-checkpoint';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { env } from '../config/env.js';
import { pgPool, pgSchema } from './pg.js';
import { sqliteDb } from './sqlite.js';

function normalizeThreadId(threadId) {
  return String(threadId || '').trim();
}

function toBuffer(value) {
  if (value == null) return null;
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }
  return Buffer.from(value);
}

class SqliteCheckpointSaver extends MemorySaver {
  constructor(db) {
    super();
    this.db = db;
    this.setupDone = false;
  }

  async setup() {
    if (this.setupDone) return;

    this.db.exec(`
CREATE TABLE IF NOT EXISTS checkpoints (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  parent_checkpoint_id TEXT,
  checkpoint_type TEXT NOT NULL,
  checkpoint_value BLOB NOT NULL,
  metadata_type TEXT NOT NULL,
  metadata_value BLOB NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  write_idx INTEGER NOT NULL,
  channel TEXT NOT NULL,
  value_type TEXT NOT NULL,
  value BLOB NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, write_idx),
  FOREIGN KEY (thread_id, checkpoint_ns, checkpoint_id)
    REFERENCES checkpoints(thread_id, checkpoint_ns, checkpoint_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_thread_ns_id
  ON checkpoints(thread_id, checkpoint_ns, checkpoint_id DESC);
`);

    this.setupDone = true;
  }

  async getTuple(config) {
    await this.setup();

    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? '';
    let checkpointId = getCheckpointId(config);
    if (!threadId) return undefined;

    let row;
    if (checkpointId) {
      row = this.db
        .prepare(
          `
SELECT checkpoint_id, parent_checkpoint_id, checkpoint_type, checkpoint_value, metadata_type, metadata_value
FROM checkpoints
WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
LIMIT 1
`,
        )
        .get(threadId, checkpointNs, checkpointId);
    } else {
      row = this.db
        .prepare(
          `
SELECT checkpoint_id, parent_checkpoint_id, checkpoint_type, checkpoint_value, metadata_type, metadata_value
FROM checkpoints
WHERE thread_id = ? AND checkpoint_ns = ?
ORDER BY checkpoint_id DESC
LIMIT 1
`,
        )
        .get(threadId, checkpointNs);
      checkpointId = row?.checkpoint_id;
    }

    if (!row || !checkpointId) return undefined;

    const pendingRows = this.db
      .prepare(
        `
SELECT task_id, channel, value_type, value
FROM checkpoint_writes
WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
ORDER BY task_id ASC, write_idx ASC
`,
      )
      .all(threadId, checkpointNs, checkpointId);

    return {
      config: {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: checkpointNs,
          checkpoint_id: checkpointId,
        },
      },
      checkpoint: await this.serde.loadsTyped(row.checkpoint_type, toBuffer(row.checkpoint_value)),
      metadata: await this.serde.loadsTyped(row.metadata_type, toBuffer(row.metadata_value)),
      parentConfig: row.parent_checkpoint_id
        ? {
            configurable: {
              thread_id: threadId,
              checkpoint_ns: checkpointNs,
              checkpoint_id: row.parent_checkpoint_id,
            },
          }
        : undefined,
      pendingWrites: await Promise.all(
        pendingRows.map(async (item) => [
          item.task_id,
          item.channel,
          await this.serde.loadsTyped(item.value_type, toBuffer(item.value)),
        ]),
      ),
    };
  }

  async *list(config, options) {
    await this.setup();

    const filter = options?.filter;
    let remaining = options?.limit;
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns;
    const checkpointId = config.configurable?.checkpoint_id;
    const beforeCheckpointId = options?.before?.configurable?.checkpoint_id;

    const clauses = [];
    const values = [];
    if (threadId) {
      clauses.push('thread_id = ?');
      values.push(threadId);
    }
    if (checkpointNs !== undefined) {
      clauses.push('checkpoint_ns = ?');
      values.push(checkpointNs);
    }
    if (checkpointId) {
      clauses.push('checkpoint_id = ?');
      values.push(checkpointId);
    }
    if (beforeCheckpointId) {
      clauses.push('checkpoint_id < ?');
      values.push(beforeCheckpointId);
    }

    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.db
      .prepare(
        `
SELECT thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, checkpoint_type, checkpoint_value, metadata_type, metadata_value
FROM checkpoints
${whereSql}
ORDER BY checkpoint_id DESC
`,
      )
      .all(...values);

    for (const row of rows) {
      const metadata = await this.serde.loadsTyped(row.metadata_type, toBuffer(row.metadata_value));
      if (filter && !Object.entries(filter).every(([key, value]) => metadata?.[key] === value)) {
        continue;
      }
      if (remaining !== undefined) {
        if (remaining <= 0) break;
        remaining -= 1;
      }

      const pendingRows = this.db
        .prepare(
          `
SELECT task_id, channel, value_type, value
FROM checkpoint_writes
WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
ORDER BY task_id ASC, write_idx ASC
`,
        )
        .all(row.thread_id, row.checkpoint_ns, row.checkpoint_id);

      yield {
        config: {
          configurable: {
            thread_id: row.thread_id,
            checkpoint_ns: row.checkpoint_ns,
            checkpoint_id: row.checkpoint_id,
          },
        },
        checkpoint: await this.serde.loadsTyped(row.checkpoint_type, toBuffer(row.checkpoint_value)),
        metadata,
        parentConfig: row.parent_checkpoint_id
          ? {
              configurable: {
                thread_id: row.thread_id,
                checkpoint_ns: row.checkpoint_ns,
                checkpoint_id: row.parent_checkpoint_id,
              },
            }
          : undefined,
        pendingWrites: await Promise.all(
          pendingRows.map(async (item) => [
            item.task_id,
            item.channel,
            await this.serde.loadsTyped(item.value_type, toBuffer(item.value)),
          ]),
        ),
      };
    }
  }

  async put(config, checkpoint, metadata) {
    await this.setup();

    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? '';
    const parentCheckpointId = config.configurable?.checkpoint_id ?? null;
    if (!threadId) {
      throw new Error('Failed to put checkpoint. Missing thread_id in config.configurable.');
    }

    const preparedCheckpoint = copyCheckpoint(checkpoint);
    const [checkpointType, checkpointValue] = await this.serde.dumpsTyped(preparedCheckpoint);
    const [metadataType, metadataValue] = await this.serde.dumpsTyped(metadata);

    this.db
      .prepare(
        `
INSERT OR REPLACE INTO checkpoints(
  thread_id,
  checkpoint_ns,
  checkpoint_id,
  parent_checkpoint_id,
  checkpoint_type,
  checkpoint_value,
  metadata_type,
  metadata_value,
  created_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
      )
      .run(
        threadId,
        checkpointNs,
        preparedCheckpoint.id,
        parentCheckpointId,
        checkpointType,
        toBuffer(checkpointValue),
        metadataType,
        toBuffer(metadataValue),
        Date.now(),
      );

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: preparedCheckpoint.id,
      },
    };
  }

  async putWrites(config, writes, taskId) {
    await this.setup();

    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? '';
    const checkpointId = config.configurable?.checkpoint_id;
    if (!threadId) {
      throw new Error('Failed to put writes. Missing thread_id in config.configurable.');
    }
    if (!checkpointId) {
      throw new Error('Failed to put writes. Missing checkpoint_id in config.configurable.');
    }

    for (let idx = 0; idx < writes.length; idx += 1) {
      const [channel, value] = writes[idx];
      const [valueType, dumpedValue] = await this.serde.dumpsTyped(value);
      const writeIdx = WRITES_IDX_MAP[channel] ?? idx;
      const sql = channel in WRITES_IDX_MAP ? 'INSERT OR REPLACE' : 'INSERT OR IGNORE';

      this.db
        .prepare(
          `
${sql} INTO checkpoint_writes(
  thread_id,
  checkpoint_ns,
  checkpoint_id,
  task_id,
  write_idx,
  channel,
  value_type,
  value
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`,
        )
        .run(threadId, checkpointNs, checkpointId, taskId, writeIdx, channel, valueType, toBuffer(dumpedValue));
    }
  }

  async deleteThread(threadId) {
    await this.setup();
    const normalizedThreadId = normalizeThreadId(threadId);
    if (!normalizedThreadId) return;
    this.db.prepare('DELETE FROM checkpoints WHERE thread_id = ?').run(normalizedThreadId);
  }

  async end() {
    return undefined;
  }
}

const sqliteCheckpointSaver = new SqliteCheckpointSaver(sqliteDb);
const postgresCheckpointSaver = new PostgresSaver(pgPool, undefined, { schema: pgSchema });

export const checkpointSaver = env.DB_PROVIDER === 'postgres' ? postgresCheckpointSaver : sqliteCheckpointSaver;

let setupPromise = null;

export async function initCheckpointer() {
  if (!setupPromise) {
    setupPromise = checkpointSaver.setup();
  }
  await setupPromise;
}

export async function clearThreadCheckpoints(threadId) {
  const normalizedThreadId = normalizeThreadId(threadId);
  if (!normalizedThreadId) return;

  await initCheckpointer();
  await checkpointSaver.deleteThread(normalizedThreadId);
}
