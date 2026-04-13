# agent-core

Shared agent runtime utilities for the sibling `agent-koa` app.

## What it contains

- `CoreAgentService`: wraps common run/stream execution flow
- `MCPRegistry`: stdio MCP client registry
- `ToolRouter`: keyword plus embedding-based tool selection
- `AGENT_DEFAULT_SYSTEM_PROMPT`: default system prompt constant
- runtime/message helpers used by the app shell

## Public API

Exported from `src/index.js`:

- `AGENT_DEFAULT_SYSTEM_PROMPT`
- `CoreAgentService`
- `describeAgentError`
- `withTimeout`
- `shouldAttemptRuntimeRecovery`
- `extractLatestUserQuery`
- `extractAssistantText`
- `extractTextFromMessageLike`
- `trimConversationMessages`
- `MCPRegistry`
- `createMCPRegistry`
- `KeywordSearch`
- `ToolRouter`
- `createToolRouter`

## Current split

`agent-core` now owns the reusable runtime pieces.
`agent-koa` should mainly stay responsible for:

- environment parsing
- persistence adapters
- Koa routes and HTTP wiring
- app-specific request/response shaping
