# Technology Stack

**Analysis Date:** 2026-01-25

## Languages

**Primary:**
- Python 3.10+ - Core voice agent (`voice_agent.py`, `src/caal/`)
- TypeScript 5 - Frontend UI with type safety
- JavaScript/Node.js - Build tooling and utilities

**Secondary:**
- Shell/Bash - Docker entry points and utility scripts
- YAML - Docker Compose configurations

## Runtime

**Environment:**
- Python 3.10+ (configured in `pyproject.toml`, target version 3.10)
- Node.js 18+ (via pnpm package manager)
- Docker & Docker Compose for containerized deployment

**Package Managers:**
- Python: `uv` (configured in `pyproject.toml`) with dependency groups (dev, cloud optional)
- Node.js: `pnpm 10.27.0+` (locked version in `frontend/package.json`)

## Frameworks

**Core Voice/Agent:**
- LiveKit Agents 1.3+ (`livekit-agents[silero,turn-detector,mcp,groq]` in `pyproject.toml`)
  - Used for WebRTC signaling, voice processing orchestration, tool execution
  - Includes plugins: Silero (voice detection), Turn Detector, MCP support, Groq integration
- FastAPI 0.115+ - Webhook server for announcements and tool reload (`src/caal/webhooks.py`)
- Uvicorn 0.32+ - ASGI server for FastAPI

**Frontend:**
- Next.js 15.5.7 - Full-stack React framework with App Router
  - Output mode: standalone (for Docker)
  - TypeScript strict mode enabled
- React 19 - UI component framework
- TailwindCSS v4 - Utility-first CSS framework
- LiveKit Components React 2.9.15 - Pre-built voice UI components

**WebRTC & Media:**
- livekit-client 2.15.15 - Client-side WebRTC connectivity (frontend)
- livekit-server-sdk 2.13.2 - Server-side LiveKit API access (frontend backend)

**STT (Speech-to-Text):**
- Speaches (via `speaches-ai/speaches` Docker images)
  - GPU variant: `ghcr.io/speaches-ai/speaches:latest-cuda-12.6.3` (NVIDIA)
  - CPU variant: `ghcr.io/speaches-ai/speaches:0.9.0-rc.3-cpu` (Groq/fallback)
  - Model: Faster-Whisper (configurable via `WHISPER_MODEL` env)

**TTS (Text-to-Speech):**
- Kokoro FastAPI (`ghcr.io/remsky/kokoro-fastapi-gpu:v0.2.4-master` for GPU)
  - GPU-optimized, supports RTX 50 series (Blackwell/sm_120)
  - Alternative: Piper (CPU-friendly, via Speaches)
- mlx-audio (Apple Silicon, Metal-accelerated)

**Infrastructure:**
- LiveKit Server (latest) - WebRTC media server and signaling
- nginx (alpine) - HTTPS reverse proxy with self-signed cert generation (Docker)

## Key Dependencies

**Critical:**
- `livekit-agents[silero,turn-detector,mcp,groq]` 1.3+ - Core agent framework with plugins
- `ollama` 0.3+ - Local LLM provider (Ollama client library)
- `groq` 0.11+ - Cloud LLM provider (Groq API client)
- `fastapi` 0.115+ - Webhook server framework
- `python-dotenv` 1.0+ - Environment variable loading

**LLM Integration:**
- `ollama` 0.3+ - Direct Ollama API client for local models
- `groq` 0.11+ - Groq cloud API client
- Optional cloud plugins: `livekit-plugins-deepgram`, `livekit-plugins-cartesia`, `livekit-plugins-openai` (in `cloud` extras)

**MCP (Model Context Protocol):**
- `livekit-agents[mcp]` - Built-in MCP support via LiveKit Agents
- Integrations: n8n (webhook-based), Home Assistant (streamable HTTP)

**Tool & Search:**
- `ddgs` 9.0+ - DuckDuckGo search (for web_search tool)
- `openwakeword` 0.6+ - Wake word detection (OpenWakeWord)
- `requests` 2.31+ - HTTP client for model preloading

**Utilities:**
- `PyYAML` 6.0+ - YAML parsing
- `aiohttp` - Async HTTP client (implicit, used by integrations)

**Frontend Dependencies:**
- `@livekit/components-react` 2.9.15 - LiveKit UI components
- `livekit-client` 2.15.15 - WebRTC client
- `livekit-server-sdk` 2.13.2 - Server-side LiveKit API
- `@picovoice/porcupine-web` 4.0.0 - Wake word detection (browser)
- `@picovoice/web-voice-processor` 4.0.9 - Audio capture pipeline
- `@radix-ui/*` - Headless UI components (select, slot, toggle, tooltip)
- `@phosphor-icons/react` 2.1.8 - Icon library
- `jose` 6.0.12 - JWT handling
- `sonner` 2.0.7 - Toast notifications
- `motion` 12.16.0 - Animation library
- `next-themes` 0.4.6 - Theme switching (light/dark)
- `clsx` 2.1.1 - Utility for conditional classNames

**Dev/Testing:**
- `pytest` 7.0+ - Python test framework
- `pytest-asyncio` 0.21+ - Async test support
- `mypy` 1.0+ - Static type checking
- `ruff` 0.1+ - Python linter and formatter
- `eslint` 9 - JavaScript linting
- `prettier` 3.4.2 - Code formatting
- `typescript` 5 - TypeScript compiler

## Configuration

**Environment:**
- `.env` - Runtime configuration (infrastructure URLs, API keys, model selection)
  - Hierarchy: settings.json (runtime-configurable) > .env > defaults
  - Key vars: `OLLAMA_HOST`, `GROQ_API_KEY`, `N8N_MCP_URL`, `SPEACHES_URL`, `KOKORO_URL`
- `settings.json` (auto-generated in `/app/config` or project root)
  - Runtime-configurable via UI, persisted to disk
  - Contains: provider selections, voice choices, integration credentials, wake word settings

**Python:**
- `pyproject.toml` - Package metadata, dependencies, tool configs
  - Ruff: 100 char line length, target Python 3.10, select rules E/F/I/N/W
  - MyPy: strict checking, warn_return_any enabled
  - Test groups: pytest, pytest-asyncio, mypy, ruff

**TypeScript/Frontend:**
- `tsconfig.json` - Strict mode enabled, path alias `@/*`
- `.eslintrc` (via `eslint-config-next`) - Next.js linting
- `.prettierrc` - Prettier formatting config
- `next.config.ts` - Next.js configuration (standalone output for Docker)

**Docker:**
- `docker-compose.yaml` - Main GPU deployment (NVIDIA + Speaches GPU + Kokoro)
- `docker-compose.cpu.yaml` - CPU-only deployment (Groq + Speaches CPU + Piper)
- `docker-compose.apple.yaml` - Apple Silicon (mlx-audio host-based)
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.distributed.yml` - Remote GPU setup
- `.env.example` - Template for required env vars
- Dockerfile - Agent container image (Python-based)
- `livekit.yaml` - LiveKit server config (LAN mode)
- `livekit-tailscale.yaml.template` - LiveKit HTTPS mode config

**Build:**
- `Makefile` - Optional build targets (if present)
- GitHub Actions CI/CD workflows (in `.github/workflows/`)

## Platform Requirements

**Development:**
- Python 3.10+ with pip/uv
- Node.js 18+ with pnpm
- Docker & Docker Compose (for containerized services)
- Git (version control)

**Deployment - GPU (NVIDIA Linux):**
- NVIDIA GPU with CUDA 12.6.3+
- Docker with nvidia-docker plugin
- Linux host (tested on Ubuntu 22.04+)

**Deployment - CPU-only:**
- No GPU required
- Groq API key (free tier available at console.groq.com)
- Docker & Docker Compose

**Deployment - Apple Silicon:**
- M1/M2/M3/M4 Mac
- Python 3.10+ for mlx-audio
- Docker for LiveKit/frontend/agent containers
- Metal GPU acceleration via mlx-audio

**Network:**
- WebRTC ports: 7880-7881 (LiveKit signaling), 30000-30100 UDP (TURN), 50000-50100 UDP (media)
- HTTP/HTTPS: 3000 (frontend), 7880 (LiveKit WS), 8889 (agent webhooks), 3443 (nginx HTTPS)
- Support for LAN-only or HTTPS (via Tailscale or self-signed certs)

---

*Stack analysis: 2026-01-25*
