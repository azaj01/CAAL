# External Integrations

**Analysis Date:** 2026-01-25

## APIs & External Services

**LLM Providers:**
- Ollama (Local) - Open-source LLM server
  - SDK/Client: `ollama` Python package v0.3+
  - Configuration: `OLLAMA_HOST` env var (default: `http://host.docker.internal:11434`)
  - Models supported: `ministral-3:8b`, `llama3.2:3b`, `qwen3:8b`, etc.
  - Think parameter: Qwen3 models support reasoning mode (configurable via `OLLAMA_THINK`)
  - Implementation: `src/caal/llm/providers/ollama_provider.py` (OllamaProvider class)

- Groq (Cloud) - Fast inference API
  - SDK/Client: `groq` Python package v0.11+
  - Auth: `GROQ_API_KEY` environment variable or settings
  - Console: https://console.groq.com/keys
  - Models: `llama-3.3-70b-versatile` (recommended), `llama-3.1-8b-instant`, `mixtral-8x7b-32768`
  - Async support: AsyncGroq client for non-blocking calls
  - Implementation: `src/caal/llm/providers/groq_provider.py` (GroqProvider class)

**STT (Speech-to-Text):**
- Speaches (Faster-Whisper) - Local GPU or CPU-based
  - Container: `ghcr.io/speaches-ai/speaches:latest-cuda-12.6.3` (GPU) or `0.9.0-rc.3-cpu` (CPU)
  - Configuration: `SPEACHES_URL` env var (default: `http://speaches:8000`)
  - Model: Faster-Whisper (configurable via `WHISPER_MODEL`)
  - Health check: `GET http://localhost:8000/health`

- Groq STT - Cloud-based fallback
  - Uses same `GROQ_API_KEY` as LLM provider
  - Integrated via LiveKit plugins

**TTS (Text-to-Speech):**
- Kokoro FastAPI - GPU-optimized for NVIDIA
  - Container: `ghcr.io/remsky/kokoro-fastapi-gpu:v0.2.4-master`
  - Configuration: `KOKORO_URL` env var (default: `http://kokoro:8880`)
  - Voices: `am_adam`, `am_puck` (male), `af_bella`, `af_heart`, `af_sarah` (female)
  - Voice selection: `TTS_VOICE` env var (default: `am_puck`)
  - Health check: `GET http://localhost:8880/health`
  - Implementation: LiveKit Agents TTS pipeline

- Piper TTS - CPU-friendly alternative
  - Included in Speaches CPU container
  - Model: `speaches-ai/piper-en_US-ryan-high` (configurable)

- mlx-audio - Apple Silicon Metal acceleration
  - Python package: `mlx-audio[all]`
  - Configuration: `MLX_AUDIO_URL` env var (default: `http://host.docker.internal:8001`)
  - Runs on host machine (not in Docker)

**Web Search:**
- DuckDuckGo (via ddgs) - Free, no API key required
  - Python package: `ddgs` 9.0+
  - Usage: `web_search` tool in `src/caal/integrations/web_search.py`
  - Results: Summarized via LLM provider for voice-friendly output
  - Timeout: 10 seconds (configurable)
  - Max results: 5 per query (configurable)

**Wake Word Detection:**
- Picovoice Porcupine (Browser-side) - Cloud-based wake word
  - SDK: `@picovoice/porcupine-web` v4.0.0 (frontend)
  - Auth: `PORCUPINE_ACCESS_KEY` env var
  - Console: https://console.picovoice.ai/
  - Files required: `hey_cal.ppn`, `porcupine_params.pv` (in `frontend/public/`)
  - Usage: Optional, disabled if key not provided

- OpenWakeWord (Server-side) - Local, on-device
  - Python package: `openwakeword` 0.6+
  - Model: Configurable (default: `models/hey_jarvis.onnx`)
  - Threshold: 0.5 (configurable via `wake_word_threshold`)
  - Implementation: `src/caal/stt/wake_word_gated.py`
  - Runs in agent container

## Data Storage

**Databases:**
- None currently integrated. Settings stored in JSON files.

**File Storage:**
- Local filesystem only
  - Settings: `settings.json` (in `/app/config` or project root)
  - Prompts: `prompt/default.md` (shipped), `prompt/custom.md` (user-created)
  - Memory: Persisted via Docker volumes (`caal-memory`, `caal-config`)

**Caching:**
- In-memory: Tool response cache (LiveKit agents native)
  - Configuration: `tool_cache_size` setting (default: 3)
- n8n workflow details cache: 1-hour TTL in `src/caal/integrations/n8n.py`
- Voice model cache: Via Speaches and Kokoro Docker volumes (`speaches-cache`, `kokoro-cache`)

## Authentication & Identity

**Auth Provider:**
- Custom (no centralized auth service)
  - LiveKit API key/secret for WebRTC access (development defaults: `devkey`/`secret`)
  - MCP server tokens: Bearer token headers for n8n and Home Assistant
  - Groq API key: Direct API authentication

**Session Management:**
- LiveKit Agents: Built-in session management via `AgentSession`
- Frontend: JWT tokens via `jose` library (for secure token handling)
- Settings: JSON file persistence (no user accounts)

## Monitoring & Observability

**Error Tracking:**
- None (platform-specific, not integrated)

**Logs:**
- Console logging via Python `logging` module
  - Structured output with timestamps
  - Per-module loggers (voice-agent, caal, dependencies)
  - Suppressed verbose logs from: httpx, httpcore, openai, groq, mcp, livekit
  - Log level: INFO for main modules, WARNING for dependencies
- Container logs: Docker stdout/stderr (accessible via `docker logs`)

**Health Checks:**
- LiveKit: `GET http://localhost:7880` (HTTP health check)
- Speaches: `GET http://localhost:8000/health` (curl-based)
- Kokoro: `GET http://localhost:8880/health` (curl-based)
- Frontend: `GET http://127.0.0.1:3000` (wget check)

## CI/CD & Deployment

**Hosting:**
- Docker Compose (local/self-hosted)
- NVIDIA GPU Linux (docker-compose.yaml)
- CPU-only with Groq (docker-compose.cpu.yaml)
- Apple Silicon (docker-compose.apple.yaml)
- Distributed remote GPU (docker-compose.distributed.yml)

**CI Pipeline:**
- GitHub Actions (workflows in `.github/workflows/`)
- Pre-commit hooks: Linting (ruff, eslint), type checking (mypy)

**Container Registry:**
- GitHub Container Registry (ghcr.io) for CAAL images
- Public registries: `livekit/livekit-server`, `ghcr.io/speaches-ai/speaches`, `ghcr.io/remsky/kokoro-fastapi-gpu`

## Environment Configuration

**Required env vars:**
- `CAAL_HOST_IP` - Machine IP for network binding
- `HTTPS_DOMAIN` - For HTTPS mode (optional, blank for HTTP LAN mode)
- `LIVEKIT_URL` - WebSocket URL for LiveKit (e.g., `ws://livekit:7880`)
- `LIVEKIT_API_KEY` - LiveKit API key (default dev: `devkey`)
- `LIVEKIT_API_SECRET` - LiveKit secret (default dev: `secret`)

**LLM Provider Selection:**
- `LLM_PROVIDER` - `"ollama"` or `"groq"`
- If Ollama: `OLLAMA_HOST`, `OLLAMA_MODEL`
- If Groq: `GROQ_API_KEY`, `GROQ_MODEL`

**Infrastructure URLs:**
- `SPEACHES_URL` - STT service (default: `http://speaches:8000`)
- `KOKORO_URL` - TTS service (default: `http://kokoro:8880`)
- `MLX_AUDIO_URL` - Apple Silicon mlx-audio (default: `http://host.docker.internal:8001`)

**MCP Servers:**
- `N8N_MCP_URL` - n8n MCP endpoint (e.g., `http://192.168.1.100:5678/mcp-server/http`)
- `N8N_MCP_TOKEN` - n8n MCP access token (get from Settings > MCP Access)

**Optional:**
- `GROQ_API_KEY` - Groq API key (if using Groq as LLM provider)
- `PORCUPINE_ACCESS_KEY` - Picovoice wake word API key
- `TIMEZONE` - IANA timezone ID (default: `America/Los_Angeles`)
- `TIMEZONE_DISPLAY` - Human-readable timezone name

**Secrets location:**
- `.env` file (git-ignored, contains all API keys and tokens)
- `settings.json` (runtime-configurable, persisted)
- Passed to containers via `env_file: ./.env` in docker-compose

## Webhooks & Callbacks

**Incoming (Agent receives):**
- n8n workflow triggers - Webhook-based execution
  - Endpoint pattern: `/webhook/{workflow_name}` on n8n server
  - Agent discovers workflows via MCP and calls them
  - Implementation: `src/caal/integrations/n8n.py` (execute_n8n_workflow function)

- Announcements/Tool reload - Internal FastAPI endpoints
  - Server: `src/caal/webhooks.py` (FastAPI)
  - Port: 8889 (exposed to docker network and host)
  - Endpoints: `/announcement` (POST), `/reload-tools` (POST)

**Outgoing (Agent calls):**
- n8n workflows - HTTP POST to webhook URLs
  - URL format: `{N8N_BASE_URL}/webhook/{workflow_name}`
  - Arguments: Passed as JSON body
  - Response: Workflow execution result (final node output)
  - Implementation: Async HTTP via aiohttp in `src/caal/integrations/n8n.py`

- Home Assistant API - Via MCP server
  - Integration: Home Assistant MCP server (`home_assistant` MCP config)
  - Auth: Bearer token in header
  - Tools generated: `hass_control`, `hass_get_state` (prefixed as `home_assistant__*`)

## MCP (Model Context Protocol) Servers

**Primary Servers:**
- n8n (workflow automation)
  - Config URL: Environment variable `N8N_MCP_URL`
  - Auth: Bearer token via `N8N_MCP_TOKEN`
  - Tools: Dynamically discovered workflows
  - Implementation: `src/caal/integrations/mcp_loader.py`, `n8n.py`
  - Transport: HTTP with `/mcp-server/http` endpoint

- Home Assistant (smart home control)
  - Config: Settings-based (`hass_enabled`, `hass_host`, `hass_token`)
  - Tools: Generic control via `hass_control` and `hass_get_state` tools
  - Transport: Streamable HTTP (for long-running operations)

**Tool Discovery & Execution:**
- Tools come from 4 sources (in `src/caal/llm/llm_node.py`):
  1. Agent methods decorated with `@function_tool`
  2. Home Assistant integration tools
  3. n8n workflows (via MCP)
  4. Other MCP servers (prefixed as `{server_name}__{tool_name}`)

**Additional MCP Servers:**
- Optional: Configured via `mcp_servers.json` file
  - Format: JSON with `servers` array, each with `name`, `url`, optional `token`, `transport`, `timeout`
  - Located: `mcp_servers.json` (in project root or agent container)

---

*Integration audit: 2026-01-25*
