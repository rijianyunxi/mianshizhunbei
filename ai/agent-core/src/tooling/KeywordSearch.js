export class KeywordSearch {
  constructor(minScore = 0) {
    this.minScore = minScore;
  }

  tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9_:\u4e00-\u9fa5-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  score(queryTokens, descriptor) {
    if (queryTokens.length === 0) return 0;

    const name = String(descriptor.name || '').toLowerCase();
    const description = String(descriptor.description || '').toLowerCase();
    const schema = JSON.stringify(descriptor.inputSchema || {}).toLowerCase();
    const serverId = String(descriptor.serverId || '').toLowerCase();

    const fields = [
      { text: name, weight: 4 },
      { text: description, weight: 2 },
      { text: schema, weight: 1 },
      { text: serverId, weight: 1 },
      { text: `server:${serverId}`, weight: 1 },
    ];

    let currentScore = 0;
    for (const token of queryTokens) {
      if (!token) continue;
      for (const field of fields) {
        if (field.text && field.text.includes(token)) {
          currentScore += field.weight;
        }
      }
    }
    return currentScore;
  }

  rank(queryTokens, descriptors) {
    if (queryTokens.length === 0) return [];
    return Array.from(descriptors)
      .map((descriptor) => ({ descriptor, score: this.score(queryTokens, descriptor) }))
      .sort((a, b) => b.score - a.score || a.descriptor.name.localeCompare(b.descriptor.name));
  }

  fallbackFromRanked(ranked, limit) {
    const maxScore = ranked.length > 0 ? ranked[0].score : 0;
    if (maxScore < this.minScore) return [];

    return ranked
      .filter((item) => item.score >= this.minScore)
      .slice(0, limit)
      .map((item) => item.descriptor);
  }

  dedupeByKey(list) {
    const seen = new Set();
    const deduped = [];
    for (const item of list) {
      if (!item || !item.key || seen.has(item.key)) continue;
      seen.add(item.key);
      deduped.push(item);
    }
    return deduped;
  }
}
