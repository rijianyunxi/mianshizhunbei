import Database from 'better-sqlite3';
import { sqlitePath } from './checkpointer.js';

const DEFAULT_CONVERSATION_TITLE = '\u65b0\u5bf9\u8bdd';
const MAX_TITLE_LENGTH = 64;
const MAX_LAST_MESSAGE_LENGTH = 240;

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

export class ConversationStore {
  constructor() {
    this.db = new Database(sqlitePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
CREATE TABLE IF NOT EXISTS conversations (
  thread_id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '${DEFAULT_CONVERSATION_TITLE}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_message TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(thread_id) REFERENCES conversations(thread_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_id_id
  ON conversation_messages(thread_id, id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON conversations(updated_at DESC);
`);

    this.insertConversationStmt = this.db.prepare(
      'INSERT OR IGNORE INTO conversations(thread_id, title, created_at, updated_at, last_message) VALUES (?, ?, ?, ?, ?)',
    );

    this.updateConversationStmt = this.db.prepare(
      'UPDATE conversations SET title = ?, updated_at = ?, last_message = ? WHERE thread_id = ?',
    );

    this.touchConversationStmt = this.db.prepare(
      'UPDATE conversations SET updated_at = ? WHERE thread_id = ?',
    );

    this.insertMessageStmt = this.db.prepare(
      'INSERT INTO conversation_messages(thread_id, role, content, created_at) VALUES (?, ?, ?, ?)',
    );

    this.listConversationsStmt = this.db.prepare(`
SELECT
  c.thread_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.last_message,
  COUNT(m.id) AS message_count
FROM conversations c
LEFT JOIN conversation_messages m ON m.thread_id = c.thread_id
GROUP BY c.thread_id
ORDER BY c.updated_at DESC
LIMIT ?
`);

    this.listMessagesStmt = this.db.prepare(`
SELECT id, thread_id, role, content, created_at
FROM conversation_messages
WHERE thread_id = ?
ORDER BY id ASC
LIMIT ?
`);

    this.deleteConversationStmt = this.db.prepare(
      'DELETE FROM conversations WHERE thread_id = ?',
    );
  }

  ensureConversation(threadId, options = {}) {
    const now = nowMs();
    const titleHint = normalizeText(options.titleHint);
    const title = titleHint ? deriveTitle(titleHint) : DEFAULT_CONVERSATION_TITLE;
    const lastMessage = truncateText(normalizeText(options.lastMessage), MAX_LAST_MESSAGE_LENGTH);

    this.insertConversationStmt.run(threadId, title, now, now, lastMessage);

    if (titleHint || lastMessage) {
      const nextTitle = titleHint ? deriveTitle(titleHint) : title;
      this.updateConversationStmt.run(nextTitle, now, lastMessage, threadId);
    } else {
      this.touchConversationStmt.run(now, threadId);
    }
  }

  appendMessage(threadId, role, content) {
    const normalizedContent = normalizeText(content);
    if (!normalizedContent) return;

    const now = nowMs();
    const lastMessage = truncateText(normalizedContent, MAX_LAST_MESSAGE_LENGTH);
    const titleHint = role === 'user' ? normalizedContent : undefined;

    this.ensureConversation(threadId, { titleHint, lastMessage });
    this.insertMessageStmt.run(threadId, role, normalizedContent, now);
  }

  listConversations(limit = 100) {
    const cappedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const rows = this.listConversationsStmt.all(cappedLimit);

    return rows.map((row) => ({
      threadId: row.thread_id,
      title: row.title || DEFAULT_CONVERSATION_TITLE,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      lastMessage: row.last_message || '',
      messageCount: Number(row.message_count) || 0,
    }));
  }

  listMessages(threadId, limit = 500) {
    const cappedLimit = Math.max(1, Math.min(Number(limit) || 500, 2000));
    const rows = this.listMessagesStmt.all(threadId, cappedLimit);

    return rows.map((row) => ({
      id: Number(row.id),
      threadId: row.thread_id,
      role: row.role,
      content: row.content,
      createdAt: Number(row.created_at),
    }));
  }

  createConversation(threadId, title) {
    this.ensureConversation(threadId, { titleHint: title });

    const [conversation] = this.listConversations(500).filter((item) => item.threadId === threadId);
    return (
      conversation || {
        threadId,
        title: normalizeText(title) ? deriveTitle(title) : DEFAULT_CONVERSATION_TITLE,
        createdAt: nowMs(),
        updatedAt: nowMs(),
        lastMessage: '',
        messageCount: 0,
      }
    );
  }

  deleteConversation(threadId) {
    this.deleteConversationStmt.run(threadId);
  }
}

export const conversationStore = new ConversationStore();
