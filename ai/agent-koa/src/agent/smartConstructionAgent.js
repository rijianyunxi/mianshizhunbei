import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createSmartConstructionAgentService } from '../../../smart-construction-agent-core/index.js';
import { env } from '../config/env.js';
import { mcpRegistry } from '../mcp/mcpRegistry.js';
import { checkpointSaver, clearThreadCheckpoints } from '../persistence/checkpointer.js';
import { toolRouter } from '../tooling/toolRouter.js';
import { jsonSchemaToZod, normalizeRole, splitText } from '../utils/schema.js';

export const smartConstructionAgent = createSmartConstructionAgentService({
  DynamicStructuredTool,
  createAgent,
  ChatOpenAI,
  uuidv4,
  z,
  env,
  mcpRegistry,
  checkpointSaver,
  clearThreadCheckpoints,
  toolRouter,
  jsonSchemaToZod,
  normalizeRole,
  splitText,
});
