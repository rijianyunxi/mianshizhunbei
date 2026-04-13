import { env } from '../config/env.js';
import { pgPool, pgSchema, quoteIdentifier } from './pg.js';
import { sqliteDb } from './sqlite.js';

const DEFAULT_CONVERSATION_TITLE = '新对话';
const MAX_TITLE_LENGTH = 64;
const MAX_LAST_MESSAGE_LENGTH = 240;

const schemaSql = quoteIdentifier(pgSchema);
const conversationsTable = `${schemaSql}.conversations`;
const messagesTable = `${schemaSql}.conversation_messages`;

function nowMs() {
  return Date.now();
}

function normalizeText(input) {
  return String(input || '').trim();
}

function truncateText(input, maxLength) {
  if (!input) return '';
  return input.length > maxLength ? `${input.slice(0, maxLength)}...` : input;
}

function deriveTitle(text) {
  const normalized = normalizeText(text);
  if (!normalized) return DEFAULT_CONVERSATION_TITLE;
  const firstLine = normalized.split(/\r?\n/)[0] || normalized;
  return truncateText(firstLine, MAX_TITLE_LENGTH) || DEFAULT_CONVERSATION_TITLE;
}

function toConversationRow(row) {
  return {
    threadId: row.thread_id,
    title: row.title || DEFAULT_CONVERSATION_TITLE,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    lastMessage: row.last_message || '',
    messageCount: Number(row.message_count) || 0,
  };
}

function toMessageRow(row) {
  return {
    id: Number(row.id),
    threadId: row.thread_id,
    role: row.role,
    content: row.content,
    createdAt: Number(row.created_at),
  };
}

class PostgresConversationStore {
  constructor() {
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.#initInternal();
    await this.initPromise;
  }

  async #initInternal() {
    await pgPool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaSql}`);

    await pgPool.query(`
CREATE TABLE IF NOT EXISTS ${conversationsTable} (
  thread_id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '${DEFAULT_CONVERSATION_TITLE}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_message TEXT NOT NULL DEFAULT ''
)
`);

    await pgPool.query(`
CREATE TABLE IF NOT EXISTS ${messagesTable} (
  id BIGSERIAL PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES ${conversationsTable}(thread_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL
)
`);

    await pgPool.query(`
CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_id_id
  ON ${messagesTable}(thread_id, id)
`);

    await pgPool.query(`
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON ${conversationsTable}(updated_at DESC)
`);
  }

  async #ensureConversation(threadId, options = {}, client = pgPool) {
    const now = nowMs();
    const titleHint = normalizeText(options.titleHint);
    const title = titleHint ? deriveTitle(titleHint) : DEFAULT_CONVERSATION_TITLE;
    const lastMessage = truncateText(normalizeText(options.lastMessage), MAX_LAST_MESSAGE_LENGTH);

    await client.query(
      `INSERT INTO ${conversationsTable}(thread_id, title, created_at, updated_at, last_message)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (thread_id) DO NOTHING`,
      [threadId, title, now, now, lastMessage],
    );

    if (titleHint || lastMessage) {
      const nextTitle = titleHint ? deriveTitle(titleHint) : title;
      await client.query(
        `UPDATE ${conversationsTable}
         SET title = $1, updated_at = $2, last_message = $3
         WHERE thread_id = $4`,
        [nextTitle, now, lastMessage, threadId],
      );
      return;
    }

    await client.query(`UPDATE ${conversationsTable} SET updated_at = $1 WHERE thread_id = $2`, [now, threadId]);
  }

  async appendMessage(threadId, role, content) {
    await this.init();

    const normalizedThreadId = normalizeText(threadId);
    const normalizedContent = normalizeText(content);
    if (!normalizedThreadId || !normalizedContent) return;

    const now = nowMs();
    const lastMessage = truncateText(normalizedContent, MAX_LAST_MESSAGE_LENGTH);
    const titleHint = role === 'user' ? normalizedContent : undefined;

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await this.#ensureConversation(normalizedThreadId, { titleHint, lastMessage }, client);
      await client.query(
        `INSERT INTO ${messagesTable}(thread_id, role, content, created_at) VALUES ($1, $2, $3, $4)`,
        [normalizedThreadId, role, normalizedContent, now],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listConversations(limit = 100) {
    await this.init();

    const cappedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const { rows } = await pgPool.query(
      `
SELECT
  c.thread_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.last_message,
  COUNT(m.id) AS message_count
FROM ${conversationsTable} c
LEFT JOIN ${messagesTable} m ON m.thread_id = c.thread_id
GROUP BY c.thread_id, c.title, c.created_at, c.updated_at, c.last_message
ORDER BY c.updated_at DESC
LIMIT $1
`,
      [cappedLimit],
    );

    return rows.map(toConversationRow);
  }

  async listMessages(threadId, limit = 500) {
    await this.init();

    const normalizedThreadId = normalizeText(threadId);
    if (!normalizedThreadId) return [];

    const cappedLimit = Math.max(1, Math.min(Number(limit) || 500, 2000));
    const { rows } = await pgPool.query(
      `
SELECT id, thread_id, role, content, created_at
FROM ${messagesTable}
WHERE thread_id = $1
ORDER BY id ASC
LIMIT $2
`,
      [normalizedThreadId, cappedLimit],
    );

    return rows.map(toMessageRow);
  }

  async createConversation(threadId, title) {
    await this.init();

    const normalizedThreadId = normalizeText(threadId);
    if (!normalizedThreadId) {
      throw new Error('threadId is required');
    }

    await this.#ensureConversation(normalizedThreadId, { titleHint: title });

    const { rows } = await pgPool.query(
      `
SELECT
  c.thread_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.last_message,
  (
    SELECT COUNT(*) FROM ${messagesTable} m WHERE m.thread_id = c.thread_id
  ) AS message_count
FROM ${conversationsTable} c
WHERE c.thread_id = $1
LIMIT 1
`,
      [normalizedThreadId],
    );

    if (rows[0]) {
      return toConversationRow(rows[0]);
    }

    return {
      threadId: normalizedThreadId,
      title: normalizeText(title) ? deriveTitle(title) : DEFAULT_CONVERSATION_TITLE,
      createdAt: nowMs(),
      updatedAt: nowMs(),
      lastMessage: '',
      messageCount: 0,
    };
  }

  async deleteConversation(threadId) {
    await this.init();
    const normalizedThreadId = normalizeText(threadId);
    if (!normalizedThreadId) return;
    await pgPool.query(`DELETE FROM ${conversationsTable} WHERE thread_id = $1`, [normalizedThreadId]);
  }
}

class SqliteConversationStore {
  constructor() {
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.#initInternal();
    await this.initPromise;
  }

  async #initInternal() {
    sqliteDb.exec(`
CREATE TABLE IF NOT EXISTS conversations (
  thread_id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '${DEFAULT_CONVERSATION_TITLE}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_message TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL REFERENCES conversations(thread_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_id_id
  ON conversation_messages(thread_id, id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON conversations(updated_at DESC);
`);
  }

  #ensureConversation(threadId, options = {}) {
    const now = nowMs();
    const titleHint = normalizeText(options.titleHint);
    const title = titleHint ? deriveTitle(titleHint) : DEFAULT_CONVERSATION_TITLE;
    const lastMessage = truncateText(normalizeText(options.lastMessage), MAX_LAST_MESSAGE_LENGTH);

    sqliteDb
      .prepare(
        `INSERT INTO conversations(thread_id, title, created_at, updated_at, last_message)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(thread_id) DO NOTHING`,
      )
      .run(threadId, title, now, now, lastMessage);

    if (titleHint || lastMessage) {
      const nextTitle = titleHint ? deriveTitle(titleHint) : title;
      sqliteDb
        .prepare(
          `UPDATE conversations
           SET title = ?, updated_at = ?, last_message = ?
           WHERE thread_id = ?`,
        )
        .run(nextTitle, now, lastMessage, threadId);
      return;
    }

    sqliteDb.prepare('UPDATE conversations SET updated_at = ? WHERE thread_id = ?').run(now, threadId);
  }

  async appendMessage(threadId, role, content) {
    await this.init();

    const normalizedThreadId = normalizeText(threadId);
    const normalizedContent = normalizeText(content);
    if (!normalizedThreadId || !normalizedContent) return;

    const now = nowMs();
    const lastMessage = truncateText(normalizedContent, MAX_LAST_MESSAGE_LENGTH);
    const titleHint = role === 'user' ? normalizedContent : undefined;

    sqliteDb.exec('BEGIN');
    try {
      this.#ensureConversation(normalizedThreadId, { titleHint, lastMessage });
      sqliteDb
        .prepare('INSERT INTO conversation_messages(thread_id, role, content, created_at) VALUES (?, ?, ?, ?)')
        .run(normalizedThreadId, role, normalizedContent, now);
      sqliteDb.exec('COMMIT');
    } catch (error) {
      sqliteDb.exec('ROLLBACK');
      throw error;
    }
  }

  async listConversations(limit = 100) {
    await this.init();

    const cappedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const rows = sqliteDb
      .prepare(
        `
SELECT
  c.thread_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.last_message,
  COUNT(m.id) AS message_count
FROM conversations c
LEFT JOIN conversation_messages m ON m.thread_id = c.thread_id
GROUP BY c.thread_id, c.title, c.created_at, c.updated_at, c.last_message
ORDER BY c.updated_at DESC
LIMIT ?
`,
      )
      .all(cappedLimit);

    return rows.map(toConversationRow);
  }

  async listMessages(threadId, limit = 500) {
    await this.init();

    const normalizedThreadId = normalizeText(threadId);
    if (!normalizedThreadId) return [];

    const cappedLimit = Math.max(1, Math.min(Number(limit) || 500, 2000));
    const rows = sqliteDb
      .prepare(
        `
SELECT id, thread_id, role, content, created_at
FROM conversation_messages
WHERE thread_id = ?
ORDER BY id ASC
LIMIT ?
`,
      )
      .all(normalizedThreadId, cappedLimit);

    return rows.map(toMessageRow);
  }

  async createConversation(threadId, title) {
    await this.init();

    const normalizedThreadId = normalizeText(threadId);
    if (!normalizedThreadId) {
      throw new Error('threadId is required');
    }

    this.#ensureConversation(normalizedThreadId, { titleHint: title });

    const row = sqliteDb
      .prepare(
        `
SELECT
  c.thread_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.last_message,
  (
    SELECT COUNT(*) FROM conversation_messages m WHERE m.thread_id = c.thread_id
  ) AS message_count
FROM conversations c
WHERE c.thread_id = ?
LIMIT 1
`,
      )
      .get(normalizedThreadId);

    if (row) {
      return toConversationRow(row);
    }

    const current = nowMs();
    return {
      threadId: normalizedThreadId,
      title: normalizeText(title) ? deriveTitle(title) : DEFAULT_CONVERSATION_TITLE,
      createdAt: current,
      updatedAt: current,
      lastMessage: '',
      messageCount: 0,
    };
  }

  async deleteConversation(threadId) {
    await this.init();
    const normalizedThreadId = normalizeText(threadId);
    if (!normalizedThreadId) return;
    sqliteDb.prepare('DELETE FROM conversations WHERE thread_id = ?').run(normalizedThreadId);
  }
}

export const conversationStore =
  env.DB_PROVIDER === 'postgres' ? new PostgresConversationStore() : new SqliteConversationStore();

export async function initConversationStore() {
  await conversationStore.init();
}
