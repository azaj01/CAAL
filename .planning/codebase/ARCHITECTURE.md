# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Multi-layer distributed voice assistant with provider-agnostic LLM abstraction and pluggable integrations.

**Key Characteristics:**
- Modular provider pattern for LLM (Ollama, Groq), STT (Speaches, Groq), TTS (Kokoro, Piper)
- Tool orchestration via MCP (Model Context Protocol) servers and webhook-based n8n integration
- Real-time bidirectional communication through LiveKit WebRTC and data channels
- Settings-driven runtime configuration with JSON persistence and .env fallback

## Layers

**Presentation Layer:**
- Purpose: Web UI for voice interaction and configuration
- Location: `frontend/app/` and `frontend/components/`
- Contains: Next.js App Router pages, React components, hooks, API routes
- Depends on: LiveKit client SDK, settings API, connection details endpoint
- Used by: End users via HTTP/WebSocket

**API Gateway Layer:**
- Purpose: HTTP endpoints for configuration, setup, model management, webhooks
- Location: `src/caal/webhooks.py`
- Contains: FastAPI routes for settings, prompts, voices, models, wake word control, health checks
- Depends on: Settings module, LiveKit API
- Used by: Frontend, external systems (n8n), setup wizard

**Agent Core Layer (LiveKit Worker):**
- Purpose: Voice session orchestration and real-time audio processing
- Location: `voice_agent.py` (entrypoint), `VoiceAssistant` class in `voice_agent.py:340`
- Contains: Session lifecycle, MCP server initialization, n8n workflow discovery, tool routing
- Depends on: LLMNode, STT/TTS providers, settings, integrations
- Used by: LiveKit server via WebSocket connection

**LLM Orchestration Layer:**
- Purpose: Provider-agnostic chat completion with tool calling support
- Location: `src/caal/llm/llm_node.py`
- Contains: Tool discovery, message building with sliding window, tool execution routing, streaming response
- Depends on: LLM providers, tool definitions, message context
- Used by: VoiceAssistant.llm_node()

**Provider Abstraction Layer:**
- Purpose: Encapsulate differences between LLM, STT, TTS backends
- Location:
  - LLM: `src/caal/llm/caal_llm.py`, `src/caal/llm/providers/base.py`, `src/caal/llm/providers/ollama_provider.py`, `src/caal/llm/providers/groq_provider.py`
  - STT: `src/caal/stt/wake_word_gated.py` wraps Speaches or Groq
  - TTS: voice_agent.py lines 470-530 (Kokoro vs Piper selection)
- Contains: Normalized interfaces, provider-specific implementations, tool response normalization
- Depends on: Provider SDKs (ollama, groq, openai)
- Used by: Agent core layer

**Integration Layer:**
- Purpose: Connect to external services (n8n, Home Assistant, web search, MCP servers)
- Location: `src/caal/integrations/`
- Contains:
  - `mcp_loader.py`: MCP server initialization from JSON config
  - `n8n.py`: Workflow discovery and webhook-based execution
  - `web_search.py`: DuckDuckGo search tool wrapper
- Depends on: MCP SDK, aiohttp for webhooks
- Used by: llm_node for tool execution

**Configuration Layer:**
- Purpose: Runtime settings management and environment-based fallback
- Location: `src/caal/settings.py`
- Contains: Settings schema, JSON persistence, prompt file loading, environment variable handling
- Depends on: pathlib, zoneinfo for timezone support
- Used by: Agent core, API gateway

## Data Flow

**Voice Session Lifecycle:**

1. **Connection**: Frontend connects to LiveKit server via WebSocket with token
2. **Room Join**: Agent's entrypoint (voice_agent.py:363) joins room, initializes:
   - MCP servers (Home Assistant, n8n, custom MCP)
   - STT/TTS providers based on settings
   - CAALLLM with appropriate provider (Ollama/Groq)
3. **Audio Capture**: LiveKit routes audio to agent via voice pipeline
4. **STT Processing**: Audio → Speaches/Groq → transcribed text
5. **LLM Processing** (llm_node.py flow):
   - Build messages from chat history with sliding window
   - Discover tools from agent methods, MCP servers, n8n workflows
   - Send to provider for chat completion
   - If tool calls returned: execute tools, cache structured data, request follow-up
   - If content returned: stream as chunks
6. **Tool Execution** (llm_node.py:_execute_tool_calls):
   - Route to appropriate executor: agent method, Home Assistant MCP, n8n webhook, other MCP tool
   - Collect results and append to message history
   - Cache structured response data for context injection
7. **TTS Processing**: Response content → Kokoro/Piper → audio stream to user
8. **Disconnect**: Frontend unload triggers session.end() cleanup

**State Management:**

Settings are loaded at agent startup from `settings.json` with `.env` fallback. Runtime changes (from frontend) go through API routes in `webhooks.py` which persist to JSON and optionally broadcast to agent via FastAPI dependency injection.

Tool response data is cached per-session in `ToolDataCache` (llm_node.py:42-72) to preserve structured data (IDs, arrays) for follow-up LLM calls.

Chat history uses sliding window (max_turns) to keep messages within context window limits while preserving recent tool results.

## Key Abstractions

**LLMProvider Interface:**
- Purpose: Abstract over Ollama/Groq API differences
- Examples: `src/caal/llm/providers/ollama_provider.py`, `src/caal/llm/providers/groq_provider.py`
- Pattern: Abstract base class with `chat()`, `chat_stream()`, normalized `LLMResponse`
- Differences handled: Ollama returns args as dict; Groq returns args as JSON string; Groq requires name in tool results

**Tool Discovery & Routing:**
- Purpose: Unify tools from multiple sources (agent methods, MCP, n8n, web search)
- Examples: llm_node.py:_discover_tools() → searches for @function_tool decorators, MCP tools, n8n workflows
- Pattern: Single tool namespace with source-specific prefixes (n8n workflow name, "search__", "home_assistant__")

**MCP Server Integration:**
- Purpose: Load Model Context Protocol servers from JSON config
- Examples: `src/caal/integrations/mcp_loader.py` instantiates clients from mcp_servers.json
- Pattern: Config-driven initialization; servers provide tools and can call agent methods

**n8n Workflow Execution:**
- Purpose: Invoke n8n workflows as tools without MCP complexity
- Examples: `src/caal/integrations/n8n.py` - workflow discovery caches descriptions from webhook node notes
- Pattern: Webhook-based: agent POSTs to `http://n8n/webhook/{workflow_name}`; caching with TTL to avoid redundant discovery

## Entry Points

**Voice Agent:**
- Location: `voice_agent.py:363` (entrypoint function)
- Triggers: LiveKit server assigns job to worker process
- Responsibilities: Room connection, MCP/n8n setup, settings initialization, VoiceAssistant instantiation

**Frontend Page:**
- Location: `frontend/app/(app)/page.tsx`
- Triggers: HTTP GET `/`
- Responsibilities: Load app config, render App component with setup status check

**API Routes:**
- Location: `frontend/app/api/*/route.ts`
- Triggers: Frontend fetches or POSTs
- Responsibilities: Setup wizard steps, model listing, settings persistence, voice list, wake word control

**Webhook Server:**
- Location: `src/caal/webhooks.py` (FastAPI app started in background thread)
- Triggers: POST /announce, /reload-tools, /wake; GET /health, /settings, /voices, /models
- Responsibilities: External tool invocation (n8n can POST /announce to make agent speak)

## Error Handling

**Strategy:** Graceful degradation with user feedback. Errors logged to CloudWatch/Docker logs; non-critical failures don't crash agent.

**Patterns:**
- MCP connection errors: Logged, sent to frontend via data channel with friendly names ("n8n enabled but could not connect")
- Tool execution failures: Caught in llm_node.py:_execute_tool_calls; error returned to LLM as assistant message
- Settings load failures: Fall back to defaults; missing .env treated as optional
- STT/TTS provider failures: Caught in voice pipeline; user hears error message via TTS

## Cross-Cutting Concerns

**Logging:** Configured in voice_agent.py lines 60-86. Non-propagating loggers prevent duplicate CloudWatch entries. Suppressed verbose dependency logs (httpx, openai, groq, livekit).

**Validation:** Settings schema defined in `src/caal/settings.py` DEFAULT_SETTINGS; API routes validate input before persistence. Tool arguments validated by provider implementations.

**Authentication:** LiveKit tokens generated by `frontend/lib/utils.ts:getSandboxTokenSource()` or via `/api/connection-details`. Home Assistant integration uses long-lived access token from settings. Groq API key stored in settings.json.

**Tool Caching:** Tool definitions discovered once per session; n8n workflow cache TTL 1 hour (llm_node.py:20-21). Structured tool response data cached separately to inject into LLM context.

---

*Architecture analysis: 2026-01-25*
