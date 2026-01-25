# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**
- Python: `snake_case` (e.g., `llm_node.py`, `wake_word_gated.py`, `web_search.py`)
- TypeScript/React: `kebab-case` for routes and files with underscores for API routes (e.g., `test-ollama/route.ts`, `agent-control-bar`)
- Directories: lowercase with hyphens (e.g., `livekit`, `agent-control-bar`) or `snake_case` for Python (e.g., `stt`, `integrations`)

**Functions:**
- Python: `snake_case` for both public and private functions (e.g., `web_search()`, `_do_search()`, `_summarize_results()`)
- Private functions prefixed with single underscore: `_execute_tool_calls()`, `_build_messages_from_context()`
- TypeScript: `camelCase` for regular functions and exports (e.g., `App()`, `useSession()`, `handleSetupComplete()`)
- Custom hooks: `use` prefix, camelCase (e.g., `useConnectionErrors()`, `useDebugMode()`)

**Variables:**
- Python: `snake_case` (e.g., `max_turns`, `tool_data_cache`, `workflow_name_map`)
- TypeScript: `camelCase` (e.g., `appConfig`, `setupCompleted`, `tokenSource`)
- Constants: `UPPER_SNAKE_CASE` in Python, `UPPER_SNAKE_CASE` in TypeScript
- Example: `DEFAULT_SETTINGS` (Python), `WEBHOOK_URL`, `PORCUPINE_ACCESS_KEY` (TypeScript)

**Types:**
- Python: Class names in `PascalCase` (e.g., `LLMProvider`, `OllamaProvider`, `GroqProvider`, `ToolDataCache`)
- TypeScript: Interface names in `PascalCase` (e.g., `AppConfig`, `AppProps`)
- Type-only imports in Python use `TYPE_CHECKING`:
  ```python
  from typing import TYPE_CHECKING
  if TYPE_CHECKING:
      from collections.abc import AsyncIterator
  ```

## Code Style

**Formatting:**
- Python: Ruff formatter and linter
- TypeScript: Prettier with custom settings

**Python Config (pyproject.toml):**
- Line length: 100 characters
- Target Python version: 3.10+
- Select rules: E, F, I, N, W (errors, pyflakes, import sorting, naming, warnings)

**TypeScript/Prettier Config (.prettierrc):**
- Single quotes: `true`
- Trailing comma: `es5`
- Semicolons: `true`
- Tab width: 2 spaces
- Print width: 100 characters
- Import order plugins: react, next, third-party, scoped, relative paths
- Plugins: `@trivago/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`

**Linting:**
- Python: Ruff (configured in `pyproject.toml`)
- TypeScript: ESLint + Prettier (extends `next/core-web-vitals`, `next/typescript`, `prettier`)

## Import Organization

**Python Order:**
1. `from __future__ import annotations` (always first)
2. Standard library imports
3. Third-party imports (e.g., `livekit`, `fastapi`, `pydantic`)
4. Local imports (e.g., `from ..integrations import`)
5. TYPE_CHECKING block for type-only imports

Example from `llm_node.py`:
```python
from __future__ import annotations

import inspect
import json
import logging
import time
from collections.abc import AsyncIterable
from typing import TYPE_CHECKING, Any

from ..integrations.n8n import execute_n8n_workflow
from ..utils.formatting import strip_markdown_for_tts
from .providers import LLMProvider

if TYPE_CHECKING:
    from .providers import ToolCall
```

**TypeScript Order (via prettier-plugin-sort-imports):**
1. React imports: `^react`
2. Next.js imports: `^next`, `^next/(.*)`
3. Third-party modules: `<THIRD_PARTY_MODULES>`
4. Scoped packages: `^@[^/](.*)`
5. Path aliases: `^@/(.*)`
6. Relative imports: `^[./]`

Example from `app.tsx`:
```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { SessionProvider, StartAudio, useSession } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentAudioRenderer } from '@/components/app/agent-audio-renderer';
```

**Path Aliases:**
- TypeScript uses `@/` for absolute imports from project root (configured in Next.js)
- Python uses relative imports with `..` for parent package navigation

## Docstrings and Comments

**Python Docstrings:**
- Triple quotes for module, class, and function docstrings
- Follow Google/NumPy style with sections: Description, Args, Returns, Yields
- Example from `llm_node.py`:
  ```python
  async def llm_node(
      agent,
      chat_ctx,
      provider: LLMProvider,
      tool_data_cache: ToolDataCache | None = None,
      max_turns: int = 20,
  ) -> AsyncIterable[str]:
      """Provider-agnostic LLM node with tool calling support.

      This function should be called from an Agent's llm_node method override.

      Args:
          agent: The Agent instance (self)
          chat_ctx: Chat context from LiveKit
          provider: LLMProvider instance (OllamaProvider, GroqProvider, etc.)
          tool_data_cache: Cache for structured tool response data
          max_turns: Max conversation turns to keep in sliding window

      Yields:
          String chunks for TTS output
      """
  ```
- Module-level docstrings describe purpose and usage
- Example from `n8n.py`:
  ```python
  """n8n workflow discovery and tool wrapping.

  Convention:
  - All workflows use webhook triggers
  - Webhook URL = http://HOST:PORT/webhook/{workflow_name}
  - Workflow descriptions in webhook node notes document expected parameters
  """
  ```

**Python Comments:**
- Minimal inline comments; code should be self-documenting
- Use comments to explain "why" not "what"
- Example: `# Remove oldest` (why), not `# Remove first item from cache`

**TypeScript/JSDoc:**
- Minimal documentation; types provide clarity
- Comments only for complex logic or non-obvious behavior
- Example from `app.tsx`:
  ```typescript
  // Check setup status on mount
  useEffect(() => {
    // ...
  }, []);
  ```

## Error Handling

**Python Patterns:**

1. **Specific Exception Catching:**
   - Always catch specific exceptions, not bare `except:`
   - Example from `n8n.py`:
     ```python
     try:
         async with session.post(webhook_url, json=arguments) as response:
             response.raise_for_status()
             return await response.json()
     except aiohttp.ClientError as e:
         logger.error(f"Failed to execute n8n workflow {workflow_name}: {e}")
         raise
     ```

2. **Logging with exc_info:**
   - Use `exc_info=True` when logging exceptions for full traceback
   - Example from `web_search.py`:
     ```python
     except Exception as e:
         logger.error(f"Web search error: {e}", exc_info=True)
         return "I had trouble searching the web. Please try again."
     ```

3. **Graceful Degradation:**
   - Return sensible defaults or user-friendly messages instead of crashing
   - Example from `web_search.py`: If search times out, return `"The search took too long. Please try a simpler query."`

4. **Tool Result Format:**
   - Normalize tool responses to consistent format via `LLMResponse` dataclass
   - Example from `base.py`:
     ```python
     @dataclass
     class LLMResponse:
         """Normalized LLM response representation."""
         content: str | None
         tool_calls: list[ToolCall]
     ```

**TypeScript Patterns:**

1. **Try-Catch in API Routes:**
   - All API routes wrap body parsing in try-catch
   - Example from `settings/route.ts`:
     ```typescript
     export async function POST(request: NextRequest) {
       try {
         const body = await request.json();
         // ... process
         return NextResponse.json(data);
       } catch (error) {
         console.error('[/api/settings] Error:', error);
         return NextResponse.json(
           { error: error instanceof Error ? error.message : 'Unknown error' },
           { status: 500 }
         );
       }
     }
     ```

2. **Error Message Check:**
   - Distinguish error types with `error instanceof Error` before accessing `.message`

3. **Logging Pattern:**
   - Use scope prefix in console.error: `[/api/settings]` for route context
   - Log backend errors when proxying: `console.error('[/api/settings] Backend error:', res.status, text)`

## Logging

**Framework:**
- Python: `logging` module (standard library)
- TypeScript: `console.error/warn/info` (no special logging library)

**Python Patterns:**
- Initialize logger per module: `logger = logging.getLogger(__name__)`
- Log levels:
  - `logger.debug()`: Low-level details (provider init, cache operations)
  - `logger.info()`: User-relevant events (tools discovered, workflows loaded, settings updated)
  - `logger.warning()`: Recoverable issues (failed to get workflow details, network timeout)
  - `logger.error()`: Errors with context (workflow execution failed)
- Example from `llm_node.py`:
  ```python
  logger.info(f"LLM returned {len(response.tool_calls)} tool call(s)")
  logger.debug(f"Cleared workflow details cache (TTL expired)")
  logger.warning(f"Unexpected workflows format: {type(workflows_data)}")
  logger.error(f"Failed to discover n8n workflows: {e}", exc_info=True)
  ```

**TypeScript Patterns:**
- Console logging in API routes and client components
- Always include context (route path, operation name)
- Log errors with backend context when proxying:
  ```typescript
  console.error('[/api/settings] Backend error:', res.status, text);
  ```

## Function Design

**Size:**
- Python: Keep functions under 50 lines when practical
- Break complex logic into private helper functions with leading underscore
- Example: `web_search()` (public, 20 lines) calls `_do_search()` and `_summarize_results()` (private)

**Parameters:**
- Python: Use type hints for all function parameters
- Avoid overly long parameter lists; use dataclasses when multiple related args
- Example from `llm_node()`:
  ```python
  async def llm_node(
      agent,
      chat_ctx,
      provider: LLMProvider,
      tool_data_cache: ToolDataCache | None = None,
      max_turns: int = 20,
  ) -> AsyncIterable[str]:
  ```
- TypeScript: Use optional props with `|` and `undefined`
- Example from `app.tsx`:
  ```typescript
  interface AppProps {
    appConfig: AppConfig;
  }
  ```

**Return Values:**
- Python: Use union types with `|` notation (PEP 604, Python 3.10+)
- Return meaningful defaults or raise exceptions, never `None` for "not found"
- Example: `async def chat() -> AsyncIterator[str]` always yields strings, never None

**Async Functions:**
- Python: Use `async def` with `await` for I/O operations
- Always use `asyncio.wait_for()` with timeout for external service calls
- Example from `web_search.py`:
  ```python
  raw_results = await asyncio.wait_for(
      self._do_search(query),
      timeout=self._search_timeout
  )
  ```

## Module Design

**Exports:**
- Python: Define `__all__` to control public API
- Example from `providers/base.py`:
  ```python
  __all__ = ["LLMProvider", "LLMResponse", "ToolCall"]
  ```

**Barrel Files:**
- Python packages use `__init__.py` with selective imports
- Example from `llm/__init__.py`: Re-export key classes for easier imports

**Dataclasses:**
- Use `@dataclass` for immutable structured data (no complex logic)
- Example from `base.py`:
  ```python
  @dataclass
  class ToolCall:
      """Normalized tool call representation."""
      id: str
      name: str
      arguments: dict[str, Any]
  ```

**Class Hierarchies:**
- Use abstract base classes for provider interfaces
- Example from `base.py`:
  ```python
  class LLMProvider(ABC):
      @property
      @abstractmethod
      def provider_name(self) -> str:
          ...
  ```
- Concrete providers inherit and implement all abstract methods

**Decorators:**
- Python: Use `@function_tool` from `livekit.agents` to expose tool methods
- Example from `web_search.py`:
  ```python
  @function_tool
  async def web_search(self, query: str) -> str:
      """Search the web for current events, news, prices..."""
  ```

---

*Convention analysis: 2026-01-25*
