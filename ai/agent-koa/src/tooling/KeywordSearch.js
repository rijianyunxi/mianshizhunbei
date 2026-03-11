/**
 * 关键字检索核心引擎类
 * 负责处理非向量方式的文本分词、属性加权打分及结果排序
 */
export class KeywordSearch {
  /**
   * 构造函数：初始化关键字检索器
   * @param {number} minScore - 关键字命中的最低及格线
   */
  constructor(minScore = 0) {
    this.minScore = minScore;
  }

  /**
   * 将输入文本清理并拆分为单词数组 (Tokens)
   * 移除了特殊字符，全部转小写，便于后续硬匹配
   * @param {string} text - 原始输入文本
   * @returns {string[]} 过滤后的词组
   */
  tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9_:\u4e00-\u9fa5-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * 针对单个工具计算关键字得分
   * 赋予不同字段不同的命中权重（名称4分，描述2分，Schema/ServerId各1分）
   * @param {string[]} queryTokens - 用户查询拆分出的词组
   * @param {Object} descriptor - 待评分的工具对象
   * @returns {number} 综合得分
   */
  score(queryTokens, descriptor) {
    if (queryTokens.length === 0) return 0;

    const name = String(descriptor.name || "").toLowerCase();
    const description = String(descriptor.description || "").toLowerCase();
    const schema = JSON.stringify(descriptor.inputSchema || {}).toLowerCase();
    const serverId = String(descriptor.serverId || "").toLowerCase();

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
        if (!field.text) continue;
        if (field.text.includes(token)) currentScore += field.weight;
      }
    }
    return currentScore;
  }

  /**
   * 遍历所有工具进行打分，并按分数从高到低排序
   * @param {string[]} queryTokens - 用户查询词组
   * @param {Iterable} descriptors - 所有工具对象的集合
   * @returns {Array} 排序后的数组，格式为 [{ descriptor, score }]
   */
  rank(queryTokens, descriptors) {
    if (queryTokens.length === 0) return [];
    return Array.from(descriptors)
      .map((descriptor) => ({
        descriptor,
        score: this.score(queryTokens, descriptor),
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.descriptor.name.localeCompare(b.descriptor.name),
      );
  }

  /**
   * 从已排序的列表中提取及格的工具（用于降级兜底）
   * @param {Array} ranked - 已排序并带得分的工具数组
   * @param {number} limit - 最大提取数量
   * @returns {Array} 纯工具描述对象数组
   */
  fallbackFromRanked(ranked, limit) {
    const maxScore = ranked.length > 0 ? ranked[0].score : 0;
    if (maxScore < this.minScore) return [];

    return ranked
      .filter((item) => item.score >= this.minScore)
      .slice(0, limit)
      .map((item) => item.descriptor);
  }

  /**
   * 根据工具的唯一标识符 (key) 对列表进行去重
   * 这是一个通用的结果清洗方法
   * @param {Array} list - 包含工具对象的数组
   * @returns {Array} 去重后的工具数组
   */
  dedupeByKey(list) {
    const seen = new Set();
    const deduped = [];
    for (const item of list) {
      if (!item || !item.key) continue;
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      deduped.push(item);
    }
    return deduped;
  }
}
