# Smart Construction Agent (Express + LangGraph + MCP)

面向智慧工地场景的 Agent 后端，采用状态图驱动（LangGraph）、MCP 工具解耦、SQLite 会话快照持久化，并支持 SSE 流式输出。

## 技术栈

- 后端调度：Node.js + Express + `@langchain/langgraph`
- 推理模型：OpenAI 兼容接口（`@langchain/openai`）
- 工具协议：MCP (`@modelcontextprotocol/sdk`)
- 会话持久化：`SqliteSaver` (`@langchain/langgraph-checkpoint-sqlite`)
- 工具路由：`OllamaEmbeddings` + `MemoryVectorStore`

## 核心能力

- ReAct 循环 + 熔断：
  - `recursionLimit`（最大迭代轮数）
  - `AGENT_TOOL_MAX_CALLS`（工具调用数上限）
- 动态工具路由（TopK）：每次请求仅向模型暴露最相关工具，避免全量工具 schema 压垮上下文。
- 混合记忆：
  - 长期：SQLite Checkpointer（按 `thread_id` 隔离）
  - 短期：滑动窗口（固定系统人设 + 最近 N 轮）
- SSE 流式：文本 token 与工具状态（`tool_start/tool_end`）分离推送。
- MCP 热插拔：运行中启停插件并重建工具索引，无需重启服务。
- 纯 RPC：绕过大模型直接调用 MCP 工具。

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

## 关键环境变量

- `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`
- `AGENT_MAX_ITERATIONS`
- `AGENT_TOOL_MAX_CALLS`
- `AGENT_TOOL_TIMEOUT_MS`
- `AGENT_CONTEXT_ROUNDS`
- `TOOL_ROUTER_TOP_K`
- `TOOL_ROUTER_EMBED_TIMEOUT_MS`
- `OLLAMA_BASE_URL`
- `OLLAMA_EMBED_MODEL`
- `SQLITE_PATH`
- `MCP_SERVERS_JSON`

## 内置 Demo MCP Server

项目内置 `src/mcp/demoSmartSiteServer.js`，可直接作为本地插件：

```bash
npm run mcp:demo
```

也可通过 `MCP_SERVERS_JSON` 让主服务自动拉起。

## 热插拔测试 MCP（建议先用这个）

项目内置 `src/mcp/hotSwapTestServer.js`，用于专门验证启停是否生效：

```bash
npm run mcp:test
```

你也可以不单独开进程，直接走后台热插拔接口让主服务拉起：

`POST /admin/mcp/servers/enable`

```json
{
  "id": "hot-swap-test",
  "command": "node",
  "args": ["src/mcp/hotSwapTestServer.js"],
  "cwd": ".",
  "description": "热插拔验证插件"
}
```

可用工具：

- `hot_swap_health`：看当前进程 `boot_id/pid`
- `hot_swap_counter_next`：自增计数器（重启插件后会归零）
- `hot_swap_echo`：回显参数（验证 RPC 链路）

典型验证流程：

1. 启用插件 -> 调 `hot_swap_counter_next` 两次（应递增）。
2. 停用插件 -> 再启用插件。
3. 再调 `hot_swap_health` 或 `hot_swap_counter_next`，确认 `boot_id` 变化且计数归零。

## CLI 调试

```bash
npm run chat -- "今天塔吊吊装前要检查什么"
npm run chat -- --stream "评估夜间高处作业风险"
npm run chat -- --stream --thread <thread_id> "继续上次方案"
```

## API

### 1) Agent 对话

`POST /agent/chat`

请求示例：

```json
{
  "thread_id": "optional-thread-id",
  "input": "今天塔吊吊装前要检查什么？",
  "stream": true,
  "model": "gpt-4.1-mini"
}
```

流式事件：

- `start`
- `delta`
- `tool_start`
- `tool_end`
- `done`

### 2) OpenAI 兼容

`POST /v1/chat/completions`

支持 `stream=true`。

提示：若要启用 SQLite 线程记忆，请传 `thread_id`，并以“增量消息”（最新 user 消息）方式调用。

### 3) MCP 热插拔管理

- `GET /admin/mcp/servers`
- `POST /admin/mcp/servers/enable`
- `POST /admin/mcp/servers/disable`
- `POST /admin/mcp/reindex`
- `GET /admin/mcp/tools`

### 4) 纯 RPC 调用工具

`POST /rpc/mcp/call`

```json
{
  "server_id": "smart-site-demo",
  "tool_name": "query_tower_crane",
  "arguments": { "crane_id": "TC-01" }
}
```

## 健康检查

`GET /health`
