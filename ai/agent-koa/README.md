# Smart Construction Agent (Koa + LangChainJS)

Koa backend that runs a LangChainJS agent for smart construction scenarios.

## Features

- Koa REST API
- LangChainJS tool-calling agent
- Smart construction tools:
  - safety risk evaluation
  - pre-shift checklist generation
  - permit requirement checking
- Session memory for `/agent/chat`
- OpenAI-compatible endpoint for frontend reuse: `/v1/chat/completions`
- SSE streaming output

## Quick Start

```bash
npm install
cp .env.example .env
```

Fill `.env`:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional, supports compatible providers)
- `OPENAI_MODEL`

Run in development:

```bash
npm run dev
```

Quick use with built-in CLI:

```bash
npm run chat -- "Generate a pre-shift checklist for tower crane lifting"
npm run chat -- --stream "Assess safety risks for tonight lifting operation"
```

Continue a session:

```bash
npm run chat -- --stream --session <sessionId> "Continue with permit checklist"
```

Pass site context:

```bash
npm run chat -- --stream --project "Site-A" --city Shanghai --weather "gust level 7" --operation lifting --shift day "Give me controls for today"
```

Run in production:

```bash
npm run start
```

## Endpoints

### 1) Agent API

`POST /agent/chat`

Request:

```json
{
  "sessionId": "optional-uuid",
  "input": "What should we check before tower-crane lifting today?",
  "stream": false,
  "siteContext": {
    "projectName": "Smart Site Phase-A",
    "city": "Shanghai",
    "weather": "gust level 7",
    "operationType": "tower crane lifting",
    "shift": "day"
  }
}
```

### 2) OpenAI-compatible API

`POST /v1/chat/completions`

Request:

```json
{
  "model": "gpt-4.1-mini",
  "stream": true,
  "messages": [
    { "role": "system", "content": "You are smart construction assistant" },
    { "role": "user", "content": "Generate a pre-shift checklist for lifting operation" }
  ]
}
```

This endpoint is compatible with your existing React chat frontend:

- API URL: `http://localhost:8787/v1`
- API Key: if `AGENT_API_TOKEN` configured, use it; otherwise any non-empty string for frontend validation.

## Health Check

`GET /health`
