import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

const DEFAULT_SQLITE_PATH = './data/agent.db';

function resolveSqlitePath(rawPath) {
  const target = String(rawPath || DEFAULT_SQLITE_PATH).trim() || DEFAULT_SQLITE_PATH;
  return path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
}

export const sqlitePath = resolveSqlitePath(env.SQLITE_PATH);

fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

export const sqliteDb = new DatabaseSync(sqlitePath);
sqliteDb.exec('PRAGMA foreign_keys = ON');
sqliteDb.exec('PRAGMA journal_mode = WAL');

export const sqliteInfo = {
  file: sqlitePath,
};

export async function closeSqliteDatabase() {
  sqliteDb.close();
}
