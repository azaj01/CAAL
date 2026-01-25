# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework Status

**Runner:**
- pytest 7.0.0+ (configured in `pyproject.toml`)
- Location: `src/caal/` (no dedicated test suite directory yet)

**Dependencies:**
- pytest>=7.0.0
- pytest-asyncio>=0.21.0
- mypy>=1.0.0 (type checking, not testing)
- ruff>=0.1.0 (linting, not testing)

**Run Commands:**
```bash
uv run pytest              # Run all tests
uv run pytest -v          # Verbose output
uv run pytest --cov       # Coverage report (if pytest-cov installed)
uv run pytest -k "test_"  # Run tests matching pattern
```

## Current Testing Status

**Test Files:**
- No test files found in codebase (`tests/` directory does not exist)
- No `conftest.py` configuration
- No `.test.py` or `.spec.py` files present

**Note:** Testing infrastructure is configured (pytest in dependencies) but test suite has not yet been implemented.

## Testing Best Practices for New Tests

When adding tests, follow these patterns:

### Test File Organization

**Location:**
- Co-located with source code: `src/caal/module/` → `tests/caal/module/test_*.py`
- Or: `src/caal/module/file.py` → `src/caal/module/test_file.py`

**Naming:**
- Test files: `test_*.py` or `*_test.py`
- Test functions: `test_*` (e.g., `test_llm_node_with_tools()`)
- Test classes: `Test*` (e.g., `TestLLMProvider`)

### Test Structure

**Fixtures for Configuration:**
```python
import pytest
from caal.llm.providers import OllamaProvider

@pytest.fixture
def ollama_provider():
    """Provide a test Ollama provider instance."""
    return OllamaProvider(
        model="llama2:7b-chat",
        base_url="http://localhost:11434"
    )

@pytest.fixture
async def mock_messages():
    """Provide sample chat messages for testing."""
    return [
        {"role": "user", "content": "What is 2+2?"}
    ]
```

**Async Test Pattern:**
```python
import pytest

@pytest.mark.asyncio
async def test_llm_provider_chat(ollama_provider, mock_messages):
    """Test LLM provider chat completion."""
    response = await ollama_provider.chat(messages=mock_messages)
    assert response.content is not None
    assert isinstance(response.tool_calls, list)
```

**Tool Execution Tests:**
```python
@pytest.mark.asyncio
async def test_execute_tool_calls():
    """Test tool discovery and execution flow."""
    # Set up agent with tools
    # Execute tool via llm_node
    # Verify tool was called with correct arguments
    # Verify response was formatted correctly
    pass
```

### Mocking Patterns

**Framework:**
- `unittest.mock` (standard library) - synchronous
- `pytest-asyncio` for async mocking
- `aiohttp` mocking for HTTP calls (when testing integration functions)

**What to Mock:**
- External HTTP services: n8n webhooks, Home Assistant, Groq API
- Streaming responses: Provider `chat_stream()` methods
- System calls: File I/O, subprocess execution

**What NOT to Mock:**
- Internal class/function calls (test the full flow)
- Python standard library utilities
- Dataclass constructors and properties

**Example Mocking Pattern:**
```python
import asyncio
from unittest.mock import AsyncMock, patch
import pytest

@pytest.mark.asyncio
async def test_n8n_workflow_execution():
    """Test n8n workflow execution with mocked HTTP."""
    with patch('aiohttp.ClientSession.post') as mock_post:
        # Mock response
        mock_response = AsyncMock()
        mock_response.json.return_value = {"output": "workflow result"}
        mock_post.return_value.__aenter__.return_value = mock_response

        # Execute
        result = await execute_n8n_workflow(
            base_url="http://localhost:5678",
            workflow_name="test_workflow",
            arguments={"key": "value"}
        )

        # Assert
        assert result["output"] == "workflow result"
        mock_post.assert_called_once()
```

### Test Data and Fixtures

**Location:**
- `tests/conftest.py` - shared fixtures
- `tests/fixtures/` - test data files
- Inline fixtures for simple cases

**Fixtures Example (conftest.py):**
```python
import pytest
from pathlib import Path

@pytest.fixture
def settings_fixture():
    """Load test settings."""
    return {
        "agent_name": "TestAgent",
        "stt_provider": "speaches",
        "llm_provider": "ollama",
        "tts_provider": "kokoro",
        "temperature": 0.7,
    }

@pytest.fixture
def sample_workflow_response():
    """Sample n8n workflow discovery response."""
    return {
        "data": [
            {
                "id": "workflow-123",
                "name": "test_workflow",
                "description": "Test workflow"
            }
        ],
        "count": 1
    }
```

### Async Testing

**Pattern:**
- Mark async test functions with `@pytest.mark.asyncio`
- Use `await` syntax naturally
- pytest-asyncio handles event loop management

```python
import pytest

@pytest.mark.asyncio
async def test_async_tool_execution():
    """Test async tool call."""
    result = await some_async_function()
    assert result is not None
```

**Async Fixture Example:**
```python
@pytest.fixture
async def async_provider():
    """Provide async LLM provider."""
    provider = OllamaProvider()
    yield provider
    # Cleanup if needed
```

### Error and Exception Testing

**Pattern:**
```python
import pytest

def test_provider_missing_api_key():
    """Test that GroqProvider raises error without API key."""
    with pytest.raises(ValueError, match="API key required"):
        GroqProvider(api_key=None, model="llama-3.3")

@pytest.mark.asyncio
async def test_timeout_handling():
    """Test web search timeout gracefully."""
    with patch('asyncio.wait_for') as mock_wait:
        mock_wait.side_effect = asyncio.TimeoutError()
        result = await web_search_tool.web_search("query")
        assert "took too long" in result  # User-friendly message
```

## Coverage Recommendations

**Critical Areas to Test:**

1. **LLM Provider Interface (`src/caal/llm/providers/`):**
   - Chat completion (non-streaming and streaming)
   - Tool calling and response formatting
   - Error handling for missing API keys
   - Provider-specific argument parsing (Ollama dict vs Groq JSON)

2. **Tool Discovery and Execution (`src/caal/llm/llm_node.py`):**
   - `_discover_tools()` - finds tools from agent, MCP servers, n8n
   - `_execute_tool_calls()` - routes tool execution to correct handler
   - Tool result caching and context injection
   - Streaming response handling

3. **Integration Points:**
   - n8n workflow discovery (`discover_n8n_workflows()`)
   - n8n workflow execution (`execute_n8n_workflow()`)
   - Settings persistence (`load_settings()`, `save_settings()`)
   - Webhook endpoints (basic endpoint tests, no full e2e)

4. **Web Search Tool (`src/caal/integrations/web_search.py`):**
   - Search execution and result summarization
   - Timeout handling
   - LLM provider fallback when unavailable
   - Error messages for user

5. **Settings Management (`src/caal/settings.py`):**
   - Default settings loading
   - File persistence and reloading
   - Environment variable fallback
   - Settings cache behavior

## Test Execution

**Development Workflow:**
```bash
# Run tests in watch mode (requires pytest-watch plugin)
uv run pytest-watch

# Run specific test file
uv run pytest tests/caal/llm/test_llm_node.py

# Run specific test function
uv run pytest tests/caal/llm/test_llm_node.py::test_tool_calling

# Run with verbose output
uv run pytest -v

# Run with output capture disabled (see print statements)
uv run pytest -s
```

**Pre-commit Checks:**
```bash
# Type checking
uv run mypy src/

# Linting
uv run ruff check src/
uv run ruff check src/ --fix  # Auto-fix

# Tests
uv run pytest
```

## Frontend Testing Status

**Frontend (Next.js):**
- No test framework configured in `package.json`
- No test files present in `frontend/`
- ESLint + Prettier configured for code quality

**If tests are added to frontend:**
- Recommended frameworks: Jest (default for Next.js) or Vitest
- Install: `pnpm add -D vitest @testing-library/react`
- Pattern: `app/api/` route testing with MSW (Mock Service Worker) for HTTP mocking
- Component testing with `@testing-library/react` for user interaction

---

*Testing analysis: 2026-01-25*
