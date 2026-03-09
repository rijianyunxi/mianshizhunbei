import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'smart-site-demo-mcp',
  version: '1.0.0',
});

server.registerTool(
  'query_tower_crane',
  {
    description: '查询塔吊状态（载重、风速、是否允许起吊）',
    inputSchema: z.object({
      crane_id: z.string().describe('塔吊编号'),
    }),
  },
  async ({ crane_id }) => {
    const payload = {
      crane_id,
      current_load_ton: 2.8,
      max_load_ton: 5,
      wind_level: 5,
      allow_lifting: true,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.registerTool(
  'query_attendance_summary',
  {
    description: '查询今日到岗统计（应到、实到、缺勤）',
    inputSchema: z.object({
      team: z.string().optional().describe('班组名称，可选'),
    }),
  },
  async ({ team }) => {
    const payload = {
      team: team || '全工地',
      expected: 86,
      present: 82,
      absent: 4,
      late: 3,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.registerTool(
  'query_site_weather',
  {
    description: '查询现场天气（风力、降雨、温度）',
    inputSchema: z.object({
      city: z.string().describe('城市'),
    }),
  },
  async ({ city }) => {
    const payload = {
      city,
      weather: '多云',
      temperature_c: 18,
      wind_level: 6,
      rain_probability: 0.3,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
