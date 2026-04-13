# 鏅烘収宸ュ湴 Agent 鏈嶅姟锛圞oa + LangGraph + MCP锛?
闈㈠悜鏅烘収宸ュ湴鍦烘櫙鐨?Agent 鍚庣鏈嶅姟锛屾牳蹇冪洰鏍囨槸鎶娿€屽ぇ妯″瀷鎺ㄧ悊銆嶃€屽伐鍏疯皟鐢ㄣ€嶃€屼細璇濇寔涔呭寲銆嶄笁浠朵簨瑙ｈ€︼紝骞朵繚鎸佸彲瑙傛祴銆佸彲鎺с€佸彲鐑彃鎷斻€?
褰撳墠瀹炵幇鍩轰簬锛?
- Koa锛圚TTP 鏈嶅姟锛?- LangGraph / LangChain锛圓gent 璋冨害锛?- MCP锛堝伐鍏峰崗璁笌鎻掍欢鏈哄埗锛?- PostgreSQL锛堜細璇濅笌鐘舵€佹寔涔呭寲锛?
## 1. 椤圭洰瀹氫綅

璇ユ湇鍔′笉鏄崟绾殑鑱婂ぉ鎺ュ彛锛岃€屾槸涓€涓彲鎺ュ叆涓氬姟绯荤粺鐨?Agent Runtime锛屽己璋冿細

- 鎸夐渶宸ュ叿鏆撮湶锛氭瘡杞彧缁欐ā鍨嬫渶鐩稿叧鐨勫伐鍏凤紝鍑忓皯涓婁笅鏂囨薄鏌撱€?- 杩愯鏃跺畨鍏ㄦ姢鏍忥細鏈€澶ц凯浠ｃ€佸伐鍏疯皟鐢ㄦ鏁般€佸伐鍏疯秴鏃躲€侀敊璇仮澶嶃€?- 绾跨▼绾ц蹇嗭細鏀寔 `thread_id` 缁村害鐨勭姸鎬佸欢缁笌鍘嗗彶鏌ヨ銆?- MCP 鎻掍欢鐑彃鎷旓細鏈嶅姟杩愯涓惎鍋滃伐鍏凤紝涓嶉噸鍚富杩涚▼銆?- 鍙屾帴鍙ｅ舰鎬侊細鍘熺敓 Agent API + OpenAI 鍏煎 API銆?
## 2. 鏍稿績鑳藉姏

- `POST /agent/chat`锛氬師鐢?Agent 瀵硅瘽锛堝悓姝?+ SSE 娴佸紡锛夈€?- `POST /v1/chat/completions`锛歄penAI 鍏煎鎺ュ彛锛堝悓姝?+ stream锛夈€?- `GET/POST/DELETE /agent/threads...`锛氱嚎绋嬩笌鍘嗗彶娑堟伅绠＄悊銆?- `GET/POST /admin/mcp/...`锛歁CP 鎻掍欢绠＄悊涓庡伐鍏风储寮曢噸寤恒€?- `POST /rpc/mcp/call`锛氱粫杩囧ぇ妯″瀷锛岀洿鎺?RPC 璋冪敤鏌愪釜 MCP 宸ュ叿銆?
## 3. 鏋舵瀯鎬昏

```text
Client
  |
  v
Koa Routes
  |- /agent/chat
  |- /v1/chat/completions
  |- /agent/threads/*
  |- /admin/mcp/*
  |- /rpc/mcp/call
  |
  v
SmartConstructionAgent
  |- Sliding Window 涓婁笅鏂囪鍓?  |- ToolRouter 閫夋嫨 TopK 宸ュ叿
  |- LangGraph Agent 鎵ц (run / stream)
  |- Checkpointer (PostgreSQL)
  |
  +--> MCPRegistry --> MCP Servers (stdio)
  |
  +--> ConversationStore (PostgreSQL)
```

### 涓€娆¤姹傜殑涓婚摼璺?
1. 璺敱灞傛牎楠岃姹備綋锛坄zod`锛夈€?2. 褰掍竴鍖栨秷鎭苟鎻愬彇鏈€鏂扮敤鎴烽棶棰樸€?3. `ToolRouter` 浠庡凡杩炴帴 MCP 宸ュ叿涓€夊嚭 TopK銆?4. 鏋勫缓 LangChain `DynamicStructuredTool`锛屾妸璋冪敤鏄犲皠鍒?`mcpRegistry.callTool`銆?5. Agent 鎵ц锛堝悓姝?`invoke` 鎴栨祦寮?`streamEvents`锛夈€?6. 钀藉簱浼氳瘽娑堟伅锛坄conversationStore`锛? 鍙€夌嚎绋?checkpoint锛坄PostgresSaver`锛夈€?7. 杩斿洖鏍囧噯 JSON 鎴?SSE 浜嬩欢娴併€?
## 4. 鐩綍缁撴瀯

```text
.
├─ src/
│  ├─ server.js                    # Koa 入口、启动与优雅关闭
│  ├─ config/env.js                # 环境变量解析与校验
│  ├─ routes/                      # API 路由层
│  │  ├─ agent.js
│  │  ├─ openaiCompatible.js
│  │  ├─ threads.js
│  │  ├─ mcpAdmin.js
│  │  └─ rpc.js
│  ├─ agent/smartConstructionAgent.js
│  ├─ tooling/
│  │  ├─ toolRouter.js
│  │  └─ KeywordSearch.js
│  ├─ mcp/
│  │  ├─ mcpRegistry.js
│  ├─ persistence/
│  │  ├─ pg.js                     # 共享 PG 连接池
│  │  ├─ checkpointer.js           # LangGraph checkpoint 存储
│  │  └─ conversations.js          # 会话与消息存储
│  └─ utils/
│     ├─ schema.js
│     └─ sse.js
└─ scripts/
```


## 5. 蹇€熷紑濮?
### 5.1 鐜瑕佹眰

- Node.js 18+锛堝缓璁?20+锛?- npm 鎴?pnpm
- 鍙€夛細鏈湴 Ollama锛堢敤浜庡伐鍏峰悜閲忔绱級

### 5.2 瀹夎

```bash
npm install
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 5.3 鏈€灏忛厤缃?
鑷冲皯婊¤冻浠ヤ笅涔嬩竴锛?
- 閰嶇疆 `OPENAI_API_KEY`
- 鎴栭厤缃?`OPENAI_BASE_URL` 鎸囧悜鍏煎 OpenAI 鐨勭綉鍏?
鑻ヤ袱鑰呴兘涓虹┖锛屾湇鍔′細鍚姩锛屼絾 Agent 浼氳繑鍥炩€滄ā鍨嬫湭閰嶇疆鈥濈殑鎻愮ず鏂囨湰銆?
### 5.4 鍚姩鏈嶅姟

```bash
npm run dev
# 鎴?npm run start
```

榛樿鐩戝惉锛歚http://localhost:8787`


```bash
```

鐑彃鎷旀祴璇曞伐鍏凤細

```bash
```

涔熷彲浠ラ€氳繃 `.env` 鐨?`MCP_SERVERS_JSON` 璁╀富鏈嶅姟鑷姩鎷夎捣鎻掍欢锛堣 `.env.example`锛夈€?

```bash
```

## 6. 鐜鍙橀噺璇存槑

| 鍙橀噺 | 榛樿鍊?| 璇存槑 |
| --- | --- | --- |
| `PORT` | `8787` | 鏈嶅姟绔彛 |
| `OPENAI_API_KEY` | 绌?| OpenAI/鍏煎鎺ュ彛瀵嗛挜 |
| `OPENAI_BASE_URL` | 绌?| 鍏煎 OpenAI 鐨勫熀鍦板潃 |
| `OPENAI_MODEL` | `gpt-4.1-mini` | 榛樿妯″瀷鍚?|
| `AGENT_API_TOKEN` | 绌?| 鑻ヨ缃紝闄?`/health` 澶栭兘闇€ `Authorization: Bearer <token>` |
| `AGENT_MAX_ITERATIONS` | `8` | Agent 鏈€澶ч€掑綊杞暟 |
| `AGENT_TOOL_MAX_CALLS` | `12` | 鍗曟璇锋眰鏈€澶у伐鍏疯皟鐢ㄦ鏁帮紙娴佸紡鎵ц鏃剁敓鏁堬級 |
| `AGENT_TOOL_TIMEOUT_MS` | `8000` | 鍗曚釜宸ュ叿璋冪敤瓒呮椂 |
| `AGENT_CONTEXT_ROUNDS` | `6` | 婊戝姩绐楀彛淇濈暀鏈€杩戣疆鏁帮紙鍙岃竟娑堟伅锛?|
| `TOOL_ROUTER_TOP_K` | `3` | 榛樿鏆撮湶缁欐ā鍨嬬殑宸ュ叿鏁伴噺 |
| `TOOL_ROUTER_KEYWORD_MIN_SCORE` | `1` | 鍏抽敭瀛楀洖閫€闃堝€?|
| `TOOL_ROUTER_VECTOR_MIN_SCORE` | `0.2` | 鍚戦噺鍙洖闃堝€硷紙鍏抽敭瀛楀懡涓緝濂芥椂锛?|
| `TOOL_ROUTER_VECTOR_MIN_SCORE_IF_NO_KEYWORD` | `0.45` | 鍚戦噺闃堝€硷紙鍏抽敭瀛楀急鍛戒腑鏃讹級 |
| `TOOL_ROUTER_EMBED_TIMEOUT_MS` | `2000` | 鍚戦噺璇锋眰瓒呮椂 |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama 鍦板潃 |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` | 鍚戦噺妯″瀷 |
| `PG_CONNECTION_STRING` | `postgresql://postgres:postgres@127.0.0.1:5432/agent_koa` | PostgreSQL 杩炴帴涓?|
| `PG_SCHEMA` | `public` | PostgreSQL schema |
| `PG_POOL_MAX` | `20` | PG 杩炴帴姹犳渶澶ц繛鎺ユ暟 |
| `PG_IDLE_TIMEOUT_MS` | `30000` | PG 杩炴帴绌洪棽瓒呮椂锛堟绉掞級 |
| `PG_CONNECT_TIMEOUT_MS` | `5000` | PG 寤鸿繛瓒呮椂锛堟绉掞級 |
| `MCP_SERVERS_JSON` | `[]` | MCP 鎻掍欢閰嶇疆鏁扮粍锛圝SON 瀛楃涓诧級 |

## 7. API 浣跨敤绀轰緥

### 7.1 鍋ュ悍妫€鏌?
```http
GET /health
```

杩斿洖鍖呭惈锛氭ā鍨嬪悕銆佹椿璺?MCP 鏁伴噺銆乼ool router 鐘舵€併€佹瀯寤烘爣璇嗙瓑銆?
### 7.2 Agent 瀵硅瘽锛堝師鐢燂級

```http
POST /agent/chat
Content-Type: application/json
```

璇锋眰锛堝悓姝ワ級锛?
```json
{
  "thread_id": "optional-thread-id",
  "input": "浠婂ぉ濉斿悐鍚婅鍓嶈妫€鏌ヤ粈涔堬紵",
  "stream": false
}
```

璇锋眰锛堟祦寮忥級锛?
```json
{
  "thread_id": "optional-thread-id",
  "messages": [
    { "role": "user", "content": "璇勪及澶滈棿楂樺浣滀笟椋庨櫓" }
  ],
  "stream": true
}
```

`stream=true` 鏃?SSE 浜嬩欢绫诲瀷锛?
- `start`
- `delta`
- `tool_start`
- `tool_end`
- `done`
- `error`

### 7.3 OpenAI 鍏煎鎺ュ彛

```http
POST /v1/chat/completions
Content-Type: application/json
```

绀轰緥锛?
```json
{
  "thread_id": "thread-001",
  "stream": true,
  "messages": [
    { "role": "user", "content": "缁х画涓婃鏂规锛岀粰鍑烘墽琛屾楠? }
  ]
}
```

璇存槑锛?
- 浼?`thread_id` 鏃朵細鍚敤绾跨▼鎸佷箙鍖栥€?- 涓洪伩鍏嶉噸澶嶄笂涓嬫枃锛屾湇鍔′細鍙彁鍙栨湰娆″閲忕敤鎴锋秷鎭弬涓庢墽琛屻€?
### 7.4 绾跨▼绠＄悊

- `GET /agent/threads?limit=100`
- `POST /agent/threads`
- `GET /agent/threads/:threadId/messages?limit=500`
- `DELETE /agent/threads/:threadId`

### 7.5 MCP 绠＄悊

- `GET /admin/mcp/servers`
- `POST /admin/mcp/servers/enable`
- `POST /admin/mcp/servers/disable`
- `POST /admin/mcp/reindex`
- `GET /admin/mcp/tools`

### 7.6 绾?RPC 璋冨伐鍏?
```http
POST /rpc/mcp/call
Content-Type: application/json
```

```json
{
  "server_id": "smart-site-demo",
  "tool_name": "query_tower_crane",
  "arguments": { "crane_id": "TC-01" }
}
```

## 8. 璇︾粏鎶€鏈偣

### 8.1 宸ュ叿鏅鸿兘璺敱锛圱oolRouter锛?
- 宸ュ叿绱㈠紩鏉ユ簮锛歚mcpRegistry.getToolDescriptors()`锛堝彧鍖呭惈褰撳墠 active 鐨?MCP 鏈嶅姟锛夈€?- 鏂囨湰鏋勫缓绛栫暐锛氫粠宸ュ叿鍚嶇О銆佹弿杩般€佸弬鏁板悕鏋勯€犺涔夋枃鏈紝閬垮厤鎶?JSON schema 鍣煶璇嶅綋鏍稿績璇箟銆?- 鍙洖绛栫暐锛?  - 棣栭€夊悜閲忔绱紙Ollama embeddings + 浣欏鸡鐩镐技搴︼級銆?  - 澶辫触鍥為€€鍒板叧閿瓧鎵撳垎锛堝瓧娈靛姞鏉冿細鍚嶇О/鎻忚堪/schema/serverId锛夈€?  - 鍔ㄦ€侀槇鍊硷細鍏抽敭瀛楀懡涓己鏃舵斁瀹藉悜閲忛槇鍊硷紝寮卞懡涓椂鎻愰珮闃堝€硷紝闄嶄綆璇彫鍥炪€?- 宸ュ叿鍙樻洿瑙﹀彂锛歁CP 鍚仠鍚庤皟鐢?`rebuildIndex()` 閲嶅缓绱㈠紩銆?
### 8.2 Agent 绋冲畾鎬т笌鎶ゆ爮

- `recursionLimit` 闄愬埗鎺ㄧ悊-宸ュ叿寰幆娣卞害銆?- 鍗曞伐鍏疯秴鏃讹細`Promise.race` + `AGENT_TOOL_TIMEOUT_MS`銆?- 宸ュ叿璋冪敤娆℃暟涓婇檺锛氭祦寮忔墽琛屼腑鐩戞帶 `on_tool_start` 璁℃暟銆?- 娴佸紡闄嶅櫔锛氬伐鍏锋墽琛屾湡闂村拷鐣ユā鍨?token 鐗囨锛岄伩鍏嶁€滃崐鎴愬搧鎬濊€冩枃鏈€濇硠婕忋€?- 寮傚父鎭㈠锛氭娴嬪埌 checkpoint 涓秷鎭鑹叉崯鍧忔椂锛屾竻鐞嗚绾跨▼ checkpoint 鍚庤嚜鍔ㄩ噸璇曚竴娆°€?
### 8.3 浼氳瘽璁板繂鍒嗗眰

- 闀挎湡鐘舵€侊細LangGraph `checkpoints/writes`锛堢嚎绋嬬骇锛夈€?- 灞曠ず涓庢绱細`conversations` + `conversation_messages`锛堢敤浜庝細璇濆垪琛ㄥ拰鍘嗗彶娑堟伅 API锛夈€?- 涓婁笅鏂囪鍓細鍥哄畾绯荤粺鎻愮ず + 鏈€杩?`AGENT_CONTEXT_ROUNDS * 2` 鏉￠潪绯荤粺娑堟伅锛屾帶鍒?token 鎴愭湰銆?
### 8.4 MCP 杩愯鏃剁鐞?
- `enable`锛氭敮鎸佸熀浜庡凡鏈夐厤缃惎鍔紝鎴栬姹備綋瑕嗙洊閰嶇疆鍚庡惎鍔ㄣ€?- `disable`锛氬叧闂?client + transport锛屽苟鏍囪閰嶇疆涓?`enabled=false`銆?- Windows 鍏煎锛歚npx` 鑷姩褰掍竴鍖栦负 `npx.cmd`銆?- runtime tool name锛歚serverId__toolName` 涓斾粎淇濈暀瀛楁瘝鏁板瓧涓嬪垝绾匡紝瑙勯伩妯″瀷宸ュ叿鍛藉悕鍐茬獊銆?
### 8.5 SSE 璁捐

- 鍘熺敓鎺ュ彛锛歚/agent/chat` 杩斿洖缁撴瀯鍖栦笟鍔′簨浠讹紙鍚?`tool_start/tool_end`锛夈€?- OpenAI 鍏煎鎺ュ彛锛氭寜 `chat.completion.chunk` 瑙勮寖鎺ㄩ€侊紝骞朵互 `[DONE]` 鏀跺熬銆?
## 9. 璁捐鑰冮噺涓庡彇鑸?
1. 涓轰粈涔堟槸 MCP 鑰屼笉鏄妸宸ュ叿纭紪鐮佸湪涓昏繘绋嬶細
   - 浼樼偣锛氳竟鐣屾竻鏅般€佹彃浠跺彲鐙珛婕旇繘銆佺儹鎻掓嫈銆?   - 浠ｄ环锛氬杩涚▼/stdio 閫氫俊甯︽潵棰濆鏁呴殰鐐癸紝闇€瑕佽繛鎺ョ鐞嗕笌閲嶈瘯绛栫暐銆?
2. 涓轰粈涔堝仛 TopK 宸ュ叿鏆撮湶锛?   - 浼樼偣锛氶檷浣?prompt 浣撶Н锛屽噺灏戞ā鍨嬭璋冪敤鏃犲叧宸ュ叿銆?   - 浠ｄ环锛氬彫鍥炵瓥鐣ラ厤缃笉褰撴椂鍙兘婕忔帀鏈簲鍙敤鐨勫伐鍏枫€?
3. 涓轰粈涔堥€?PostgreSQL锛?   - 浼樼偣锛氫簨鍔¤兘鍔涘拰骞跺彂鑳藉姏鏇村己锛岄€傚悎澶氬疄渚嬩笌鐢熶骇鐜銆?   - 浠ｄ环锛氱浉姣?SQLite 杩愮淮澶嶆潅搴︽洿楂橈紝闇€瑕佺嫭绔嬫暟鎹簱鏈嶅姟銆?
4. 涓轰粈涔堜繚鐣?OpenAI 鍏煎灞傦細
   - 浼樼偣锛氬彲鐩存帴鎺ュ叆鐜版湁 SDK/鍓嶇鐢熸€侊紝闄嶄綆杩佺Щ鎴愭湰銆?   - 浠ｄ环锛氶渶瑕佺淮鎶や袱濂楀搷搴旇涔夛紙鍘熺敓 + 鍏煎锛夈€?
## 10. 璋冧紭寤鸿

1. 宸ュ叿璇彫鍥炲亸澶氾細
   - 鎻愰珮 `TOOL_ROUTER_VECTOR_MIN_SCORE`锛屽苟妫€鏌ュ伐鍏锋弿杩版槸鍚﹁繃浜庢硾鍖栥€?2. 宸ュ叿婕忓彫鍥烇細
   - 鎻愰珮 `TOOL_ROUTER_TOP_K`锛岄€傚綋闄嶄綆鍚戦噺闃堝€笺€?3. 鍝嶅簲鎱細
   - 缂╃煭 `AGENT_CONTEXT_ROUNDS`銆侀檷浣庡伐鍏疯秴鏃躲€佷紭鍖?MCP 宸ュ叿鏈韩鑰楁椂銆?4. 棰戠箒寰幆璋冪敤宸ュ叿锛?   - 闄嶄綆 `AGENT_MAX_ITERATIONS` 涓?`AGENT_TOOL_MAX_CALLS`銆?
## 11. 宸茬煡闂涓庢敞鎰忎簨椤?

- 涓埆婧愮爜鏂囦欢娉ㄩ噴瀛樺湪涔辩爜锛堢紪鐮佸巻鍙查棶棰橈級锛屼笉褰卞搷杩愯锛屼絾寤鸿缁熶竴涓?UTF-8 閲嶆柊鏁寸悊銆?
## 12. 鍚庣画鍙墿灞曟柟鍚?
1. 澧炲姞鑷姩鍖栨祴璇曪細璺敱 contract 娴嬭瘯銆丮CP 闆嗘垚娴嬭瘯銆佸伐鍏疯矾鐢卞彫鍥炴祴璇曘€?2. 寮曞叆鍙娴嬫€э細璇锋眰閾捐矾 tracing銆佸伐鍏疯皟鐢ㄨ€楁椂缁熻銆侀敊璇垎绫汇€?3. 澶氱鎴烽殧绂伙細鎸夌鎴峰尯鍒?`thread_id` 鍓嶇紑涓庢彃浠舵潈闄愩€?4. 寮曞叆璇诲啓鍒嗙鎴栫紦瀛樺眰锛堝 Redis锛変互杩涗竴姝ユ彁鍗囬珮骞跺彂涓嬬殑鍚炲悙銆?

