function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (value === 'ai') return 'assistant';
  if (value === 'human') return 'user';
  return value;
}

function textFromContentBlocks(blocks) {
  const parts = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if (typeof block.text === 'string' && block.text) {
      parts.push(block.text);
      continue;
    }
    if (block.type === 'text' && typeof block.text === 'string' && block.text) {
      parts.push(block.text);
      continue;
    }
    if (block.type === 'output_text' && typeof block.text === 'string' && block.text) {
      parts.push(block.text);
      continue;
    }
    if (block.type === 'resource' && block.resource && typeof block.resource.text === 'string') {
      parts.push(block.resource.text);
    }
  }
  return parts.join('');
}

export function extractTextFromMessageLike(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string' && value.text) return value.text;
  if (typeof value.output_text === 'string' && value.output_text) return value.output_text;
  if (typeof value.content === 'string') return value.content;
  if (Array.isArray(value.content)) return textFromContentBlocks(value.content);
  if (Array.isArray(value.contentBlocks)) return textFromContentBlocks(value.contentBlocks);
  return '';
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null;
  const role = normalizeRole(message.role || message.type);
  const content = extractTextFromMessageLike(message);
  if (!role || !content) return null;
  return { role, content };
}

export function trimConversationMessages(messages, contextRounds) {
  const normalized = Array.isArray(messages)
    ? messages.map((message) => normalizeMessage(message)).filter((message) => message !== null)
    : [];

  const systemMessages = normalized.filter((message) => message.role === 'system');
  const nonSystemMessages = normalized.filter((message) => message.role !== 'system');
  const roundCount = Math.max(1, Number(contextRounds) || 1);
  const windowSize = roundCount * 2;

  return [...systemMessages, ...nonSystemMessages.slice(-windowSize)];
}

export function extractLatestUserQuery(messages) {
  const normalized = Array.isArray(messages)
    ? messages.map((message) => normalizeMessage(message)).filter((message) => message !== null)
    : [];

  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    if (normalized[index].role === 'user') {
      return normalized[index].content;
    }
  }

  return '';
}

export function extractAssistantText(payload) {
  if (!payload) return '';

  const candidates = [];
  if (Array.isArray(payload)) {
    candidates.push(payload);
  }
  if (Array.isArray(payload.messages)) {
    candidates.push(payload.messages);
  }
  if (payload.output && Array.isArray(payload.output.messages)) {
    candidates.push(payload.output.messages);
  }
  if (payload.data && Array.isArray(payload.data.messages)) {
    candidates.push(payload.data.messages);
  }

  for (const messages of candidates) {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const item = messages[index];
      const role = normalizeRole(item?.role || item?.type);
      if (role !== 'assistant') continue;
      const text = extractTextFromMessageLike(item);
      if (text) return text;
    }
  }

  return extractTextFromMessageLike(payload);
}
