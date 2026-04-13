import { createMCPRegistry } from '../../../agent-core/src/mcp/mcpRegistry.js';
import { env } from '../config/env.js';

export const mcpRegistry = createMCPRegistry(env.MCP_SERVERS, {
  clientName: 'smart-construction-agent-host',
  clientVersion: '1.0.0',
});
