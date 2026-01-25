# Codebase Concerns

**Analysis Date:** 2026-01-25

## Tech Debt

### Broad Exception Handling in Core Modules

**Area:** LLM node execution, integrations, STT
- **Issue:** Multiple `except Exception as e:` clauses that catch all exceptions without specific handling
- **Files:**
  - `src/caal/llm/llm_node.py` (lines 170, 225-226, 236-237, 386, 450, 551)
  - `src/caal/llm/ollama_node.py` (lines 227, 274-275, 283-284, 426, 488, 579)
  - `src/caal/integrations/mcp_loader.py` (lines 74, 150-152, 227, 235, 240)
  - `src/caal/stt/wake_word_gated.py` (lines 117, 232)
- **Impact:** Difficult to distinguish recoverable errors (timeout, network) from unrecoverable errors (invalid tool, permission); error messages leak implementation details to LLM; makes debugging harder
- **Fix approach:** Replace with specific exception types (httpx.TimeoutException, json.JSONDecodeError, AttributeError, etc.) and handle each appropriately. Use error classification to determine whether to retry, skip gracefully, or propagate.

### Global Mutable State in Integration Modules

**Area:** Workflow and settings caching
- **Issue:** Global mutable dictionaries used for caching without thread-safety mechanisms
- **Files:**
  - `src/caal/integrations/n8n.py` (lines 19-21): `_workflow_details_cache`, `_cache_timestamp` globals
  - `src/caal/settings.py` (line 87): `_settings_cache` global
- **Impact:** Race conditions if accessed from multiple threads during concurrent requests; cache invalidation relies on TTL with no way to force refresh during hot-reload; settings mutations could leave cache in inconsistent state
- **Fix approach:** Replace with thread-safe caches (threading.Lock or asyncio.Lock for async); implement proper cache invalidation semantics; consider using a cache library (cachetools) with TTL support.

### Fire-and-Forget Async Tasks

**Area:** Tool status and wake word callbacks
- **Issue:** `asyncio.create_task()` used without awaiting or tracking for completion in critical paths
- **Files:**
  - `src/caal/llm/llm_node.py` (lines 130-131, 156, 165): Tool status callbacks
  - `src/caal/stt/wake_word_gated.py` (line 375): Wake detection callback
- **Impact:** Tasks may not complete before agent shuts down; unhandled exceptions in tasks won't be visible; callbacks could interfere with agent's response timing
- **Fix approach:** Track created tasks in agent state; implement structured concurrency (nurseries or task groups in Python 3.11+); ensure callbacks complete or cancel gracefully before agent cleanup.

## Known Bugs

### Tool Call Argument Parsing Inconsistency

**Bug description:** Different tool types handle arguments inconsistently, leading to potential silent failures
- **Symptoms:** Tool calls might not receive expected arguments; JSON serialization/deserialization may lose data types
- **Files:**
  - `src/caal/llm/llm_node.py` (lines 206-220): FunctionCall arguments converted to JSON string
  - `src/caal/llm/llm_node.py` (lines 423-424): Arguments passed as dict to _execute_single_tool
- **Trigger:** When LLM returns tool calls with complex nested arguments or null values
- **Workaround:** Convert arguments back from JSON string in _execute_single_tool before use

### MCP Server Connection Hanging

**Bug description:** MCP server initialization can hang indefinitely on bad connections
- **Symptoms:** Agent startup hangs; MCP server appears to initialize but never completes
- **Files:** `src/caal/integrations/mcp_loader.py` (lines 205-231)
- **Trigger:** When MCP server URL is unreachable, auth fails, or server is slow to respond
- **Current mitigation:** Pre-flight httpx test with 3-second timeout before calling initialize() prevents most hangs, but initialize() itself has no timeout
- **Workaround:** Set LIVEKIT_AGENT_SHUTDOWN_TIMEOUT env var to kill agent if startup hangs

### Wake Word State Reset During Active Conversation

**Bug description:** Wake word model is reset without checking if still needed for next utterance
- **Symptoms:** Wake word detection becomes less reliable after timeout; rapid follow-up utterances may be missed if timeout triggers mid-stream
- **Files:** `src/caal/stt/wake_word_gated.py` (lines 319-321)
- **Trigger:** User goes silent for configured timeout (default 3s) while thinking of follow-up
- **Workaround:** Increase `wake_word_timeout` setting to give more time for user to respond; disable wake word timeout in settings for continuous conversation mode

## Security Considerations

### Secrets Exposed in Logs and Error Messages

**Area:** API keys and tokens in error output
- **Risk:** Groq API keys, n8n tokens, Home Assistant tokens logged in plaintext when errors occur
- **Files:**
  - `src/caal/integrations/mcp_loader.py`: HTTP status errors include auth details
  - `src/caal/integrations/n8n.py`: Workflow execution errors may include webhook URLs
  - `src/caal/webhooks.py`: Settings API responses might expose tokens
- **Current mitigation:** Token values partially masked in frontend UI only (shown as dots)
- **Recommendations:**
  1. Strip sensitive keys before logging errors (use settings.SENSITIVE_KEYS list)
  2. Never include auth headers in exception messages
  3. Mask token values in error messages (first/last 4 chars only)
  4. Use structured logging that separates user-facing messages from debug data

### Broad CORS Allowlist

**Area:** Frontend access control
- **Risk:** `allow_origins=["*"]` on webhook server allows requests from any origin
- **Files:** `src/caal/webhooks.py` (lines 60-66)
- **Current mitigation:** Webhook endpoints are only on localhost:8889 in Docker; network isolation via containers
- **Recommendations:**
  1. Restrict CORS to known frontend origin if deployed outside Docker
  2. Add origin validation based on CAAL_FRONTEND_URL env var
  3. Implement rate limiting per origin

### Settings and Prompt File Permissions

**Area:** File access control
- **Risk:** settings.json and prompt/custom.md contain user config and custom prompts with no access control
- **Files:**
  - `src/caal/settings.py` (lines 194-226): Writes settings.json with default permissions
  - `src/caal/settings.py` (lines 298-312): Writes custom.md with default permissions
- **Impact:** If CAAL runs as unprivileged user, still readable by other users on shared system
- **Recommendations:**
  1. Set restrictive permissions (0600) on settings.json after write
  2. Store tokens/API keys in OS keyring instead of JSON
  3. Encrypt sensitive values in JSON with user-specific key

### Unvalidated n8n Workflow Execution

**Area:** Workflow parameter injection
- **Risk:** LLM can pass arbitrary JSON parameters to n8n workflows via webhook
- **Files:** `src/caal/integrations/n8n.py` (lines 114-136): execute_n8n_workflow accepts any arguments dict
- **Impact:** Could trigger unintended workflow behaviors if LLM misunderstands workflow parameters
- **Recommendations:**
  1. Validate workflow arguments against schema from get_workflow_details
  2. Whitelist allowed parameters for each workflow
  3. Log all workflow executions with user input for audit trail

## Performance Bottlenecks

### Unbounded Tool Response Caching

**Area:** Tool response data context injection
- **Problem:** ToolDataCache stores raw tool responses without size limits; can grow unbounded for large JSON responses
- **Files:**
  - `src/caal/llm/llm_node.py` (lines 42-72)
  - `src/caal/llm/ollama_node.py` (lines 36-66)
- **Cause:** Cache only implements LRU by count (max_entries=3) but doesn't limit total size
- **Impact:** If tools return large arrays or nested structures, context message could exceed LLM's token limit
- **Improvement path:**
  1. Add max_size_bytes limit to cache
  2. Trim individual entries if >10KB before caching
  3. Measure cache size on add() and evict oldest if threshold exceeded

### MCP Tool Listing on Every User Message

**Area:** Tool discovery overhead
- **Problem:** Tool discovery runs for every user message to check for new tools; each MCP server call adds latency
- **Files:** `src/caal/llm/llm_node.py` (lines 264-349)
- **Cause:** Tools cached on agent instance but cache check happens in llm_node async function with possible race conditions
- **Impact:** 100-500ms latency per message waiting for MCP calls to complete
- **Improvement path:**
  1. Move tool cache check outside llm_node to agent initialization
  2. Implement tool cache invalidation flag instead of checking every call
  3. Batch MCP server calls (call list_tools once, not per-tool)

### OpenWakeWord Model Loading on Every Stream

**Area:** Model initialization
- **Problem:** OpenWakeWord model loaded lazily in _ensure_model() but not efficiently reused
- **Files:** `src/caal/stt/wake_word_gated.py` (lines 107-120, 141-144)
- **Cause:** Model is stored on STT instance but each new stream call may create new STT instances
- **Impact:** Model loading (500ms-1s) delays first utterance detection
- **Improvement path:**
  1. Load model at agent startup, not at stream creation time
  2. Store model reference in shared location (agent or module level)
  3. Add model prewarming endpoint to /prewarm API route

## Fragile Areas

### Multiple LLM Node Implementations

**Component:** LLM integration layer
- **Files:**
  - `src/caal/llm/llm_node.py` (554 lines)
  - `src/caal/llm/ollama_node.py` (582 lines)
  - `src/caal/llm/caal_llm.py` (201 lines)
  - `src/caal/llm/ollama_llm.py` (214 lines)
- **Why fragile:**
  1. Two parallel implementations (llm_node and ollama_node) with duplicated logic
  2. Tool discovery, message building, and tool execution shared but not factored
  3. Changing tool routing requires updates in multiple places
  4. Test coverage unclear - changes break untested paths
- **Safe modification:**
  1. Extract shared tool execution logic to separate module
  2. Use inheritance or composition to reduce duplication
  3. Add comprehensive tests for each tool source (agent methods, n8n, MCP)
  4. Deprecate one implementation path clearly

### MCP Server Initialization Complexity

**Component:** Integration loading
- **Files:** `src/caal/integrations/mcp_loader.py` (245 lines)
- **Why fragile:**
  1. Home Assistant, n8n, and custom MCP servers have different initialization paths
  2. Three-level priority system (settings > env > JSON config) is non-obvious
  3. Pre-flight validation uses httpx but main init uses MCPServerHTTP - inconsistent libraries
  4. Timeout handling uses both httpx.TimeoutException and generic TimeoutError
- **Safe modification:**
  1. Add unit tests for each server type (HASS, n8n, generic)
  2. Extract validation logic to separate function
  3. Use consistent timeout/error handling across all paths
  4. Document priority system in code comment

### Settings Migration Logic

**Component:** First-launch and user upgrade flow
- **Files:** `src/caal/settings.py` (lines 113-129)
- **Why fragile:**
  1. Migration detection uses heuristic checking if env vars AND settings keys exist
  2. Logic combines two conditions with AND but intent unclear (existing user check is ambiguous)
  3. One-time migration runs but no logging if already migrated
  4. Settings file could be corrupted and logic would silently skip migration
- **Safe modification:**
  1. Add explicit migration version marker to settings.json
  2. Check migration version instead of inferring from env vars
  3. Log all migration paths (already migrated, no migration needed, migrated now)
  4. Add rollback option for manual recovery

## Scaling Limits

### Sequential Tool Execution

**Resource:** LLM response time per tool call
- **Current capacity:** One tool per LLM response; tools wait for each other
- **Limit:** If tool execution takes >10s (n8n workflow, API call), user perceives long delay
- **Scaling path:**
  1. Implement parallel tool execution for independent tools
  2. Start concurrent n8n workflow executions instead of awaiting sequentially
  3. Set per-tool timeout and return partial results if one tool is slow

### Single Agent Per Room

**Resource:** Concurrent conversations
- **Current capacity:** One agent instance per LiveKit room; agent blocks while processing
- **Limit:** Can't handle rapid-fire messages or concurrent tool calls
- **Scaling path:**
  1. Implement request queuing in agent
  2. Use thread pool or async workers for tool execution
  3. Add queue length monitoring to prevent unbounded buffering

### Memory Growth in Long Sessions

**Resource:** Message history and cache growth
- **Current capacity:** Sliding window limited to max_turns (default 20)
- **Limit:** Each message adds ~500 bytes; after 100+ messages, context approaches LLM limit
- **Scaling path:**
  1. Implement message summary/compression for old messages
  2. Move archived messages to disk storage
  3. Add per-user memory/token accounting

## Dependencies at Risk

### OpenWakeWord Model Path Hardcoded

**Risk:** Model file path is hardcoded in settings; missing models cause startup failure
- **Impact:** Deployment breaks if model file not at `models/hey_jarvis.onnx`
- **Current:** Default setting points to relative path that may not exist
- **Migration plan:**
  1. Ship model files in Docker image at known path
  2. Add model download/validation at startup
  3. Fall back to web-based wake detection if local model missing

### LiveKit Agent SDK Stability

**Risk:** LiveKit v0.x APIs are unstable; breaking changes in minor versions
- **Impact:** Future LiveKit updates may require code changes (tool calling format, STT interface, TTS streaming)
- **Current:** Code depends on several private APIs (e.g., `_use_streamable_http` on MCPServerHTTP)
- **Migration plan:**
  1. Monitor LiveKit releases and deprecation notices
  2. Abstract LiveKit-specific code behind interfaces
  3. Pin to specific LiveKit version for stability
  4. Add version check at startup to warn about incompatibilities

### DuckDuckGo API No Warranty

**Risk:** Web search tool depends on DDGS library which may change or break
- **Impact:** Web search functionality could suddenly fail
- **Current:** DDGS library has no formal API contract; library version not pinned
- **Migration plan:**
  1. Add fallback search provider (Bing Search API, SearXNG)
  2. Gracefully degrade if DuckDuckGo unavailable
  3. Pin ddgs version in pyproject.toml

## Missing Critical Features

### No Input Validation for Tool Parameters

**Problem:** LLM parameters passed directly to tool functions without validation
- **Blocks:** Reliable automation; safety in production deployments
- **Current approach:** Tools expected to validate own inputs; LLM responsible for correct format
- **Recommendation:**
  1. Use JSON Schema validation against tool definitions
  2. Reject tool calls with missing/invalid parameters before execution
  3. Return validation errors to LLM for retry

### No Audit Logging for Tool Execution

**Problem:** No record of who executed what and when
- **Blocks:** Security compliance; debugging user issues; Home Assistant state changes untraceable
- **Current approach:** Agent logs to console; no persistent record
- **Recommendation:**
  1. Log all tool calls with user, timestamp, arguments, results
  2. Store in append-only format (JSON lines or database)
  3. Expose via API for security dashboard

### No Request Context/Tracing

**Problem:** Difficult to correlate logs across agent, n8n, Home Assistant during multi-step flows
- **Blocks:** Debugging complex workflows; understanding user journey
- **Current approach:** Each system logs independently with no correlation IDs
- **Recommendation:**
  1. Generate request_id per user utterance
  2. Pass through all tool calls, webhooks, and API requests
  3. Include in all log messages for traceability

## Test Coverage Gaps

### Tool Execution Routing Untested

**What's not tested:** Path selection between agent methods, n8n workflows, and MCP tools
- **Files:** `src/caal/llm/llm_node.py` (lines 463-517)
- **Risk:** Tool routing logic could silently fail; wrong tool could be called without error
- **Priority:** High - tool execution is core functionality
- **Tests needed:**
  1. Test each tool source (agent method, n8n, MCP) in isolation
  2. Test tool name collisions and precedence
  3. Test missing tools error handling

### Error Recovery in Agent Initialization

**What's not tested:** Agent startup with misconfigured integrations (missing MCP servers, bad tokens)
- **Files:** `src/caal/integrations/mcp_loader.py`, voice_agent.py initialization
- **Risk:** Agent might partially fail to start with no error indication
- **Priority:** Medium - affects first-time setup
- **Tests needed:**
  1. Test with unreachable MCP servers
  2. Test with invalid auth tokens
  3. Test with missing optional integrations

### Wake Word Detection Edge Cases

**What's not tested:** Wake word behavior at boundaries (timeout at 2.99s, multi-model predictions)
- **Files:** `src/caal/stt/wake_word_gated.py`
- **Risk:** Timeout may trigger mid-utterance; low-confidence predictions cause false triggers
- **Priority:** Medium - impacts UX
- **Tests needed:**
  1. Test state transitions at exact timeout boundaries
  2. Test threshold behavior at prediction scores near boundary
  3. Test multiple concurrent state changes

### Settings Persistence and Migration

**What's not tested:** Settings file corruption, partial migrations, concurrent access
- **Files:** `src/caal/settings.py`
- **Risk:** User settings could be lost; migration could corrupt file
- **Priority:** High - affects user data safety
- **Tests needed:**
  1. Test settings.json with invalid JSON
  2. Test concurrent read/write access
  3. Test upgrade from old settings format
  4. Test settings.json not writable (permission error)

---

*Concerns audit: 2026-01-25*
