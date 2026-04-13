import { env } from '../config/env.js';
import { closePgPool, pgInfo } from './pg.js';
import { closeSqliteDatabase, sqliteInfo } from './sqlite.js';

export const storageInfo =
  env.DB_PROVIDER === 'postgres'
    ? {
        provider: 'postgres',
        ...pgInfo,
      }
    : {
        provider: 'sqlite',
        ...sqliteInfo,
      };

export async function closePersistence() {
  if (env.DB_PROVIDER === 'postgres') {
    await closePgPool();
    return;
  }

  await closeSqliteDatabase();
}
