import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { env } from '../config/env.js';

function normalizeCommand(command) {
  const value = String(command || '').trim();
  if (!value) return value;
  if (process.platform === 'win32' && value.toLowerCase() === 'npx') {
    return 'npx.cmd';
  }
  return value;
}

function normalizePluginConfig(config) {
  return {
    id: String(config.id || '').trim(),
    command: normalizeCommand(config.command),
    args: Array.isArray(config.args) ? config.args.map((arg) => String(arg)) : [],
    cwd: config.cwd ? String(config.cwd) : undefined,
    description: config.description ? String(config.description) : undefined,
    enabled: config.enabled !== false,
    env: config.env && typeof config.env === 'object' ? Object.fromEntries(Object.entries(config.env).map(([k, v]) => [k, String(v)])) : {},
  };
}

function toToolText(result) {
  const parts = [];
  if (Array.isArray(result?.content)) {
    for (const block of result.content) {
      if (!block || typeof block !== 'object') continue;
      if (block.type === 'text' && typeof block.text === 'string') {
        parts.push(block.text);
        continue;
      }
      if (block.type === 'resource' && block.resource) {
        if (typeof block.resource.text === 'string') {
          parts.push(block.resource.text);
        } else {
          parts.push(JSON.stringify(block.resource));
        }
      }
    }
  }

  if (result?.structuredContent && typeof result.structuredContent === 'object') {
    parts.push(JSON.stringify(result.structuredContent));
  }

  if (parts.length === 0) {
    return result?.isError ? 'Tool returned an error.' : JSON.stringify(result ?? {});
  }

  return parts.join('\n').trim();
}

function toolKey(serverId, toolName) {
  return `${serverId}:${toolName}`;
}

function runtimeToolName(serverId, toolName) {
  const normalized = `${serverId}__${toolName}`.replace(/[^a-zA-Z0-9_]/g, '_');
  return normalized.slice(0, 64);
}

class MCPRegistry {
  constructor(initialConfigs = []) {
    this.configs = new Map();
    this.active = new Map();

    for (const config of initialConfigs) {
      const normalized = normalizePluginConfig(config);
      if (normalized.id && normalized.command) {
        this.configs.set(normalized.id, normalized);
      }
    }
  }

  register(config) {
    const normalized = normalizePluginConfig(config);
    if (!normalized.id || !normalized.command) {
      throw new Error('Plugin config requires id and command');
    }
    this.configs.set(normalized.id, normalized);
    return normalized;
  }

  list() {
    const rows = [];
    for (const config of this.configs.values()) {
      const active = this.active.get(config.id);
      rows.push({
        ...config,
        active: Boolean(active),
        pid: active?.transport?.pid ?? null,
        toolCount: active?.tools?.length ?? 0,
        connectedAt: active?.connectedAt ?? null,
        lastError: active?.lastError ?? null,
      });
    }
    return rows.sort((a, b) => a.id.localeCompare(b.id));
  }

  async bootstrapEnabled() {
    const errors = [];
    for (const config of this.configs.values()) {
      if (!config.enabled) continue;
      try {
        await this.enable(config.id);
      } catch (error) {
        errors.push({ id: config.id, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return errors;
  }

  async enable(id, overrideConfig) {
    const base = overrideConfig ? this.register(overrideConfig) : this.configs.get(id);
    if (!base) {
      throw new Error(`Plugin not found: ${id}`);
    }

    const existing = this.active.get(base.id);
    if (existing && !overrideConfig) {
      const listed = await existing.client.listTools();
      existing.tools = Array.isArray(listed.tools) ? listed.tools : [];
      return existing;
    }

    if (existing) {
      await this.disable(base.id);
    }

    const transport = new StdioClientTransport({
      command: base.command,
      args: base.args,
      cwd: base.cwd,
      env: { ...process.env, ...base.env },
      stderr: 'pipe',
    });

    if (transport.stderr) {
      transport.stderr.on('data', (chunk) => {
        const text = String(chunk || '').trimEnd();
        if (text) {
          console.error(`[mcp:${base.id}] ${text}`);
        }
      });
    }

    const client = new Client({
      name: 'smart-construction-agent-host',
      version: '1.0.0',
    });

    await client.connect(transport);
    const listed = await client.listTools();

    const connection = {
      id: base.id,
      client,
      transport,
      config: base,
      connectedAt: new Date().toISOString(),
      tools: Array.isArray(listed.tools) ? listed.tools : [],
      lastError: null,
    };

    this.active.set(base.id, connection);
    this.configs.set(base.id, { ...base, enabled: true });
    return connection;
  }

  async disable(id) {
    const connection = this.active.get(id);
    if (!connection) {
      const config = this.configs.get(id);
      if (config) {
        this.configs.set(id, { ...config, enabled: false });
      }
      return false;
    }

    try {
      await connection.client.close();
    } catch {
      // ignore close errors
    }

    try {
      await connection.transport.close();
    } catch {
      // ignore close errors
    }

    this.active.delete(id);
    const config = this.configs.get(id);
    if (config) {
      this.configs.set(id, { ...config, enabled: false });
    }
    return true;
  }

  async refreshTools(id) {
    const connection = this.active.get(id);
    if (!connection) throw new Error(`Plugin not active: ${id}`);
    const listed = await connection.client.listTools();
    connection.tools = Array.isArray(listed.tools) ? listed.tools : [];
    return connection.tools;
  }

  getToolDescriptors() {
    const descriptors = [];
    for (const [serverId, connection] of this.active.entries()) {
      for (const tool of connection.tools) {
        descriptors.push({
          key: toolKey(serverId, tool.name),
          runtimeName: runtimeToolName(serverId, tool.name),
          serverId,
          name: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        });
      }
    }
    return descriptors;
  }

  async callTool(serverId, toolName, args = {}) {
    const connection = this.active.get(serverId);
    if (!connection) {
      throw new Error(`MCP server is not active: ${serverId}`);
    }

    const result = await connection.client.callTool({
      name: toolName,
      arguments: args,
    });

    return {
      text: toToolText(result),
      raw: result,
      isError: Boolean(result?.isError),
    };
  }

  async callToolByKey(key, args = {}) {
    const [serverId, ...nameParts] = String(key).split(':');
    if (!serverId || nameParts.length === 0) {
      throw new Error(`Invalid tool key: ${key}`);
    }
    return this.callTool(serverId, nameParts.join(':'), args);
  }

  async shutdown() {
    const ids = Array.from(this.active.keys());
    for (const id of ids) {
      await this.disable(id);
    }
  }
}

export const mcpRegistry = new MCPRegistry(env.MCP_SERVERS);
