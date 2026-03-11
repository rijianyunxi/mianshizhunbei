import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件所在目录的绝对路径，确保 1.json 准确生成在当前代码文件旁边
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 连接数据库
const db = new Database('../data/agent-checkpoints.sqlite', { 
  // verbose: console.log, // 写入大量数据时，建议关掉 verbose，否则终端会被刷屏
  readonly: true,
});

// 2. 查询所有数据
const stmt = db.prepare('SELECT * FROM checkpoints');
const rows = stmt.all();

console.log(`成功读取到 ${rows.length} 条数据，正在解析 Buffer...`);

// 3. 遍历并转换 Buffer 为 JSON 对象
const parsedRows = rows.map(row => {
  // 浅拷贝当前行，避免直接修改原始结果
  const newRow = { ...row };

  // 解析 checkpoint
  if (Buffer.isBuffer(newRow.checkpoint)) {
    try {
      const jsonString = newRow.checkpoint.toString('utf-8');
      newRow.checkpoint = JSON.parse(jsonString);
    } catch (e) {
      console.warn(`警告: ID 为 ${newRow.checkpoint_id} 的 checkpoint 解析 JSON 失败`);
      newRow.checkpoint = newRow.checkpoint.toString('utf-8'); // 如果解析失败，至少保留字符串形态
    }
  }

  // 解析 metadata
  if (Buffer.isBuffer(newRow.metadata)) {
    try {
      const jsonString = newRow.metadata.toString('utf-8');
      newRow.metadata = JSON.parse(jsonString);
    } catch (e) {
      console.warn(`警告: ID 为 ${newRow.checkpoint_id} 的 metadata 解析 JSON 失败`);
      newRow.metadata = newRow.metadata.toString('utf-8');
    }
  }

  return newRow;
});

// 4. 将解析后的对象写入到 1.json
const outputPath = path.join(__dirname, '1.json');

// JSON.stringify 的第三个参数 2 表示使用 2 个空格进行格式化缩进，让生成的 JSON 文件极其易读
fs.writeFileSync(outputPath, JSON.stringify(parsedRows, null, 2), 'utf-8');

console.log(`🎉 转换完成！所有数据已格式化并保存至: ${outputPath}`);

// 关闭数据库
db.close();