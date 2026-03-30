import { pgPool, pgSchema, quoteIdentifier } from './pg.js';

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

class ConversationStore {
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

export const conversationStore = new ConversationStore();

export async function initConversationStore() {
  await conversationStore.init();
}
