# Codebase Structure

**Analysis Date:** 2026-01-25

## Directory Layout

```
/Users/mmaudet/work/CAAL/
├── voice_agent.py              # Voice agent entrypoint (LiveKit worker)
├── docker-compose.yaml         # Production stack (GPU)
├── docker-compose.cpu.yaml     # CPU-only stack (Groq + Piper)
├── docker-compose.apple.yaml   # Apple Silicon stack (mlx-audio)
├── docker-compose.dev.yml      # Development overrides
├── Dockerfile                  # Agent container build
├── src/caal/                   # Python agent package
├── frontend/                   # Next.js web UI
├── mobile/                     # Flutter mobile app
├── prompt/                     # System prompts (default.md, custom.md)
├── docs/                       # Documentation
└── .planning/                  # GSD planning artifacts
```

## Directory Purposes

**src/caal/ - Agent Core Package**
- Purpose: Modular voice assistant with provider abstraction and integrations
- Contains: LLM providers, STT/TTS wrappers, settings, integrations, webhooks
- Key files: `__init__.py` exports CAALLLM; `settings.py` handles configuration

**src/caal/llm/ - LLM Provider Abstraction**
- Purpose: Provider-agnostic LLM orchestration with tool calling
- Contains:
  - `caal_llm.py`: Wrapper satisfying LiveKit's llm.LLM interface
  - `llm_node.py`: Tool discovery, execution routing, message building (core logic)
  - `ollama_llm.py`: Legacy OllamaLLM (deprecated, backward compatible)
  - `providers/`: Base interface and implementations (Ollama, Groq)

**src/caal/llm/providers/ - LLM Provider Implementations**
- Purpose: Encapsulate API differences between Ollama and Groq
- Contains:
  - `base.py`: Abstract LLMProvider, normalized LLMResponse and ToolCall
  - `ollama_provider.py`: Ollama client with think parameter support
  - `groq_provider.py`: Groq client with async support
  - `__init__.py`: Provider factory function

**src/caal/stt/ - Speech-to-Text**
- Purpose: Audio input pipeline with wake word gating
- Contains:
  - `wake_word_gated.py`: OpenWakeWord wrapper gating audio to inner STT
  - `__init__.py`: Exports WakeWordGatedSTT

**src/caal/integrations/ - External Service Integration**
- Purpose: Connect to Home Assistant (MCP), n8n (webhook), web search, custom MCP servers
- Contains:
  - `mcp_loader.py`: Load MCP server configs from JSON, initialize clients
  - `n8n.py`: Workflow discovery via MCP, webhook-based execution
  - `web_search.py`: DuckDuckGo search tool wrapper
  - `__init__.py`: Public exports

**src/caal/utils/ - Utilities**
- Purpose: Shared helper functions
- Contains:
  - `formatting.py`: strip_markdown_for_tts() to clean TTS output

**frontend/ - Next.js Web UI**
- Purpose: Real-time voice interaction, settings panel, setup wizard
- Key files:
  - `app/layout.tsx`: Root layout with fonts, theme provider
  - `app/(app)/page.tsx`: Main app page
  - `app/api/`: API routes for backend communication

**frontend/components/ - React Components**
- Purpose: UI building blocks and feature containers
- Structure:
  - `app/`: High-level features (App, SessionView, SettingsPanel, SetupWizard)
  - `livekit/`: LiveKit-specific components (chat transcript, agent control bar)
  - `setup/`: Setup wizard steps (provider, STT, integrations)
  - `settings/`: Settings panel UI
  - `ui/`: Reusable UI primitives (tooltip, alert, scroll-area)

**frontend/hooks/ - React Hooks**
- Purpose: Stateful logic for voice, settings, connection management
- Key files:
  - `useWakeWord.ts`: Wake word detection and audio management
  - `useAutoMute.ts`: Automatic microphone muting during agent speech
  - `useConnectionErrors.tsx`: Display MCP connection errors
  - `useWakeWordState.ts`: Wake word state management
  - `useToolStatus.ts`: Track active tool invocations

**frontend/lib/ - Utilities**
- Purpose: API clients, token generation, app configuration
- Key files:
  - `utils.ts`: getAppConfig(), getSandboxTokenSource(), getStyles()

**frontend/styles/ - CSS**
- Purpose: Global styles and design tokens
- Contains: TailwindCSS globals.css

**prompt/ - System Prompts**
- Purpose: Agent personality and behavior definition
- Files:
  - `default.md`: Ships with CAAL, immutable
  - `custom.md`: User's custom prompt (created if user saves custom prompt)

**mobile/ - Flutter Mobile App**
- Purpose: Native iOS/macOS/Android client
- Contains: Flutter app structure (lib, ios, macos, android directories)

## Key File Locations

**Entry Points:**
- `voice_agent.py`: Python agent entrypoint (main block starts LiveKit worker)
- `frontend/app/(app)/page.tsx`: Web UI entrypoint (renders App component)
- `frontend/app/api/setup/status/route.ts`: Setup status check (first API call from frontend)

**Configuration:**
- `voice_agent.py` (lines 87-99): Infrastructure config from .env (URLs, models)
- `src/caal/settings.py` (lines 32-80): Runtime settings schema and defaults
- `pyproject.toml`: Python project metadata and lint config
- `frontend/tsconfig.json`: TypeScript config with path aliases
- `.env.example`: Template for infrastructure variables

**Core Logic:**
- `voice_agent.py` (lines 340-356): VoiceAssistant class with llm_node override
- `src/caal/llm/llm_node.py`: Tool discovery, message building, execution routing
- `src/caal/llm/caal_llm.py`: LiveKit LLM interface wrapper
- `src/caal/llm/providers/base.py`: Provider abstraction interface

**Testing:**
- `pyproject.toml` [tool.pytest.ini_options]: Test configuration
- Test files co-located with source (not yet implemented; typical pattern: `test_*.py` files)

## Naming Conventions

**Files:**
- Python modules: `snake_case.py` (e.g., `wake_word_gated.py`, `ollama_provider.py`)
- TypeScript files: `kebab-case.ts` or `kebab-case.tsx` (e.g., `settings-panel.tsx`, `wake-word-provider.tsx`)
- Config files: All lowercase with dots (e.g., `settings.json`, `.eslintrc`, `.prettierrc`)

**Directories:**
- Python packages: `snake_case` (e.g., `src/caal/llm/`, `src/caal/integrations/`)
- Component directories: `kebab-case` (e.g., `components/app/`, `components/livekit/`)
- Feature-grouped: Group by feature, not type (e.g., `setup/` contains all setup wizard steps)

**Python Functions/Classes:**
- Classes: `PascalCase` (e.g., `VoiceAssistant`, `OllamaProvider`, `WakeWordGatedSTT`)
- Functions: `snake_case` (e.g., `discover_n8n_workflows()`, `initialize_mcp_servers()`)
- Private functions: Leading underscore (e.g., `_discover_tools()`, `_execute_tool_calls()`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `CAAL_SETTINGS_PATH`, `DEFAULT_SETTINGS`)

**TypeScript:**
- Components: `PascalCase` function component (e.g., `App`, `SettingsPanel`, `SessionView`)
- Hooks: `usePascalCase` (e.g., `useWakeWord`, `useAutoMute`)
- API routes: Flat path structure (e.g., `/api/settings`, `/api/setup/complete`)
- Types: `PascalCase` interface (e.g., `AppConfig`)

**MCP & n8n Integration:**
- n8n workflow tools: Tool name derived from workflow name (spaces → underscores)
- MCP tools: Prefixed with server name (e.g., `home_assistant__turn_on`, `search__web`)

## Where to Add New Code

**New Tool Integration:**
1. Add MCP server config to `mcp_servers.json` OR
2. Add n8n workflow (auto-discovered) OR
3. Add Home Assistant device (auto-discovered)
4. Add web search (already available as `search_web` tool)

**New Agent Feature:**
- Implementation: Add method to `VoiceAssistant` class in `voice_agent.py` decorated with `@function_tool`
- Tests: Add `test_voice_agent.py` at project root (not yet done; follow pytest pattern)
- Settings: Add keys to `DEFAULT_SETTINGS` in `src/caal/settings.py`
- API endpoint: Add route to `src/caal/webhooks.py` if external access needed

**New Frontend Feature:**
- Component: `frontend/components/{feature}/{component-name}.tsx`
- API route: `frontend/app/api/{endpoint}/route.ts`
- Hook: `frontend/hooks/use{FeatureName}.ts` if stateful
- Tests: Co-locate with component or in `__tests__` folder (not yet implemented)

**New LLM Provider:**
1. Create `src/caal/llm/providers/{provider_name}_provider.py`
2. Implement `LLMProvider` abstract base class
3. Add factory case to `src/caal/llm/providers/__init__.py:create_provider_from_settings()`
4. Add setting keys to `DEFAULT_SETTINGS` in `src/caal/settings.py`
5. Add setup step to frontend setup wizard

**New STT/TTS Provider:**
- STT: Wrap in `src/caal/stt/` following `wake_word_gated.py` pattern
- TTS: Add provider selection logic to `voice_agent.py` (lines 470-530)
- Settings: Add keys to `DEFAULT_SETTINGS`
- Frontend: Add setup step for provider selection

## Special Directories

**voice_agent.py:**
- Purpose: Monolithic entrypoint file (may be refactored into package)
- Generated: No
- Committed: Yes
- Note: Houses VoiceAssistant class, infrastructure setup, tool definitions, entrypoint function

**data/ (created at runtime):**
- Purpose: Docker volume for persistent data (settings.json, custom prompts)
- Generated: Yes (Docker creates if missing)
- Committed: No (git-ignored)

**models/ (created at runtime):**
- Purpose: Downloaded model files (wake word models, TTS weights)
- Generated: Yes (downloaded on demand)
- Committed: No (git-ignored)

**node_modules/, .next/ (frontend):**
- Purpose: Dependencies and build artifacts
- Generated: Yes
- Committed: No (git-ignored)

**.auto-claude/ (GSD system):**
- Purpose: Auto-Claude insights, roadmap, specs
- Generated: Yes (by auto-claude system)
- Committed: Yes (tracked in git)

---

*Structure analysis: 2026-01-25*
