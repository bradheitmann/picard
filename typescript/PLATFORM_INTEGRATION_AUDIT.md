# Platform Integration Audit

## Current State: INCOMPLETE

We have **1 platform bridge** (Claude Code filesystem) but need **18+ platforms**.

---

## Platform Categories & Integration Needs

### 1. Desktop/Extension-Based (VS Code, Cursor, Zed)

**Platforms:**
- Claude Code (VS Code)
- Cursor Desktop
- VS Code + Copilot/Continue/Cody
- Zed Editor

**Integration Method:**
- Extension/Plugin API
- File watchers
- LSP protocol
- IPC/Sockets

**What's Missing:**
❌ Extension for each platform
❌ LSP middleware
❌ IPC server
❌ File system event watchers

**What We Need:**
```typescript
// Extension sends events to PICARD
await fetch('http://localhost:8765/events', {
  method: 'POST',
  body: JSON.stringify(event)
});

// PICARD sends commands via file
// Extension watches ~/.picard/commands/
```

---

### 2. CLI/Terminal-Based (Codex, Trae, Gemini, Kline)

**Platforms:**
- GPT-5 Codex CLI
- Trae CLI
- Gemini CLI
- Kline CLI
- Ollama CLI

**Integration Method:**
- Stdout/stderr parsing
- Config files
- Wrapper scripts
- Process monitoring

**What's Missing:**
❌ CLI wrappers for each tool
❌ Stdout parser
❌ Process monitors
❌ Config injectors

**What We Need:**
```bash
# Wrapper that intercepts CLI
#!/bin/bash
# ~/.picard/wrappers/codex-wrapper.sh

# Log to PICARD before running
picard event emit tool.invocation --agent codex-cli

# Run actual tool
codex "$@"

# Log completion
picard event emit tool.completed --agent codex-cli
```

---

### 3. Web/Cloud-Based (Claude Web, Cursor Web, Copilot Workspace)

**Platforms:**
- Claude Code Web (claude.ai/code)
- Cursor Composer Web
- Codex Web
- GitHub Copilot Workspace

**Integration Method:**
- Browser extensions
- Webhooks
- API polling
- Manual logging

**What's Missing:**
❌ Browser extension (Chrome/Firefox)
❌ Webhook receivers
❌ API clients for each platform
❌ Authentication flow

**What We Need:**
```typescript
// Browser extension content script
// Injected into claude.ai/code

const observer = new MutationObserver(() => {
  // Detect agent actions
  const codeBlocks = document.querySelectorAll('.agent-output');

  // Send to PICARD
  fetch('http://localhost:8765/events', {
    method: 'POST',
    body: JSON.stringify({
      type: 'action.code_generated',
      agent_id: 'claude-web',
      metadata: {/*...*/}
    })
  });
});
```

---

### 4. Code Generation Platforms (Roo, Kilocode, OpenCode)

**Platforms:**
- Roo Code
- Kilocode
- OpenCode

**Integration Method:**
- Platform APIs
- Webhooks
- Git commit parsing

**What's Missing:**
❌ API clients
❌ Webhook handlers
❌ Git watchers

---

### 5. LLM Routing/Proxies (OpenRouter, LiteLLM)

**Platforms:**
- OpenRouter
- LiteLLM

**Integration Method:**
- Proxy middleware
- Request/response logging

**What's Missing:**
❌ Proxy middleware
❌ Request interceptors
❌ Token counting

---

## CRITICAL MISSING COMPONENTS

### 1. **Platform Registry**

```typescript
// src/platforms/registry.ts

interface Platform {
  id: string;
  name: string;
  type: 'desktop' | 'cli' | 'web' | 'api';
  integration: 'extension' | 'wrapper' | 'api' | 'webhook' | 'manual';
  status: 'supported' | 'experimental' | 'planned';
  adapter: string; // Path to adapter code
}

export const PLATFORMS: Platform[] = [
  {
    id: 'claude-code',
    name: 'Claude Code (VS Code)',
    type: 'desktop',
    integration: 'extension',
    status: 'supported',
    adapter: 'adapters/claude-code'
  },
  // ... 18+ more
];
```

### 2. **Platform Adapters**

```typescript
// src/platforms/adapters/base.ts

export interface PlatformAdapter {
  // Send command to platform
  sendCommand(command: Command): Promise<void>;

  // Receive events from platform
  on(event: string, handler: (data: any) => void): void;

  // Check if platform is available
  isAvailable(): Promise<boolean>;

  // Deploy agent to platform
  deploy(agent: Agent, config: DeployConfig): Promise<void>;

  // Platform-specific setup
  setup(): Promise<void>;
}
```

### 3. **Event Normalization**

```typescript
// Different platforms emit different formats
// Need to normalize to PICARD format

// Cursor event
{
  "event": "code_written",
  "file": "src/app.ts",
  "lines": 50
}

// ↓ Normalize to PICARD format ↓

{
  "type": "action.file_write",
  "agent_id": "cursor-001",
  "metadata": {
    "file_path": "src/app.ts",
    "lines_added": 50
  }
}
```

### 4. **Authentication Manager**

```typescript
// src/auth/manager.ts

// Store API keys securely
// Manage OAuth tokens
// Handle platform credentials

export class AuthManager {
  storeKey(platform: string, key: string): void;
  getKey(platform: string): string | null;
  refreshToken(platform: string): Promise<void>;
}
```

### 5. **Browser Extension**

```
picard-browser-extension/
├── manifest.json
├── content-scripts/
│   ├── claude-web.ts      # claude.ai/code
│   ├── cursor-web.ts      # cursor.com
│   └── copilot-workspace.ts
├── background.ts          # Event relay to localhost
└── popup.tsx              # Extension UI
```

### 6. **CLI Wrappers**

```bash
# ~/.picard/wrappers/

# Wrap each CLI tool
codex-wrapper.sh
trae-wrapper.sh
gemini-wrapper.sh
kline-wrapper.sh

# User adds to PATH:
# export PATH="~/.picard/wrappers:$PATH"

# Now 'codex' command auto-logs to PICARD
```

### 7. **Webhook Server**

```typescript
// src/webhook-server.ts

// Receive webhooks from platforms
// GitHub, OpenCode, etc.

app.post('/webhook/github', (req, res) => {
  // Parse GitHub webhook
  // Emit PICARD event
  // Store in database
});
```

### 8. **Platform Health Checks**

```typescript
// Continuously check platform availability

setInterval(() => {
  for (const platform of PLATFORMS) {
    const available = await platform.adapter.isAvailable();

    if (!available) {
      // Alert user
      // Mark agents as unavailable
      // Reassign tasks
    }
  }
}, 60000); // Every minute
```

---

## IMPLEMENTATION PLAN

### Phase 1: Framework (2-3 hours)
- [ ] Platform registry
- [ ] Base adapter interface
- [ ] Event normalizer
- [ ] Auth manager
- [ ] Webhook server

### Phase 2: Desktop Platforms (3-4 hours)
- [ ] Claude Code adapter (enhance existing)
- [ ] Cursor adapter
- [ ] VS Code adapter
- [ ] Zed adapter

### Phase 3: CLI Platforms (2 hours)
- [ ] CLI wrapper framework
- [ ] Codex wrapper
- [ ] Trae wrapper
- [ ] Gemini wrapper

### Phase 4: Web Platforms (4-5 hours)
- [ ] Browser extension (Chrome/Firefox)
- [ ] Claude Web integration
- [ ] Cursor Web integration
- [ ] Copilot Workspace integration

### Phase 5: API Platforms (2 hours)
- [ ] GitHub API client
- [ ] OpenRouter adapter
- [ ] Platform-specific clients

---

## ESTIMATED TOTAL: 15-20 hours for complete integration

---

## WHAT DO YOU WANT TO BUILD NOW?

**Option A:** Framework + 3-4 key platforms (6 hours)
- Platform registry
- Claude Code (desktop)
- Codex CLI
- Claude Web (browser ext)

**Option B:** Just framework (2 hours)
- Gives structure for community to add platforms

**Option C:** Ship as-is, iterate later
- Current system works for power users
- Community can contribute platform adapters

Which approach?
