import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const startedAt = new Date().toISOString();
const bootId = `${process.pid}-${Date.now()}`;
let counter = 0;

const server = new McpServer({
  name: 'hot-swap-test-mcp',
  version: '1.0.0',
});

server.registerTool(
  'hot_swap_health',
  {
    description: '返回测试 MCP 进程信息，用于确认插件是否在线。',
    inputSchema: z.object({
      tag: z.string().optional().describe('可选标记，用于区分请求来源'),
    }),
  },
  async ({ tag }) => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            ok: true,
            server: 'hot-swap-test-mcp',
            boot_id: bootId,
            pid: process.pid,
            started_at: startedAt,
            tag: tag || null,
          },
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerTool(
  'hot_swap_counter_next',
  {
    description: '自增计数器。停用并重新启用插件后，计数会回到 0。',
    inputSchema: z.object({
      step: z.number().int().min(1).max(100).optional().describe('每次递增步长，默认 1'),
    }),
  },
  async ({ step }) => {
    const value = step ?? 1;
    counter += value;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ok: true,
              boot_id: bootId,
              counter,
              step: value,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

server.registerTool(
  'hot_swap_echo',
  {
    description: '回显输入参数，便于检查 RPC 链路是否正常。',
    inputSchema: z.object({
      message: z.string().min(1).describe('要回显的文本'),
      metadata: z.record(z.string(), z.any()).optional().describe('附加对象'),
    }),
  },
  async ({ message, metadata }) => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            ok: true,
            boot_id: bootId,
            message,
            metadata: metadata || {},
            now: new Date().toISOString(),
          },
          null,
          2,
        ),
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
