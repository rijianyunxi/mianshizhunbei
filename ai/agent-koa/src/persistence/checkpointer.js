import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { env } from '../config/env.js';

export const sqlitePath = resolve(process.cwd(), env.SQLITE_PATH);
mkdirSync(dirname(sqlitePath), { recursive: true });

export const checkpointSaver = SqliteSaver.fromConnString(sqlitePath);
