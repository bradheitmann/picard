# 🌐 Cloud-Based Agent Integration

**How to work with cloud coding agents in PICARD**

---

## Cloud Agent Platforms

### Web-Based Agents
- **Claude Code (Web)** - claude.ai/code
- **Cursor Composer (Web)** - cursor.com/composer
- **GitHub Copilot Workspace** - Web-based
- **Codex Cloud** - OpenAI cloud
- **Replit Agent** - replit.com
- **Pieces OS** - Cloud sync
- **Codeium** - Cloud backend
- **Tabnine Enterprise** - Cloud

---

## Integration Strategies

### Strategy 1: Webhook Event Emission

**How it works**: Cloud agents POST events to your local PICARD

```
Cloud Agent (claude.ai)
    ↓ (webhook)
PICARD Event Collector (localhost:8765)
    ↓
SQLite Database
    ↓
PICARD Dashboard
```

**Setup**:
```bash
# 1. Expose event collector (local tunnel)
# Install: brew install cloudflared
cloudflared tunnel --url http://localhost:8765

# Output: https://random-subdomain.trycloudflare.com
# This is your webhook URL
```

**Configure Cloud Agent**:
```javascript
// In cloud agent's custom instructions or init script
const PICARD_WEBHOOK = "https://your-tunnel.trycloudflare.com/events";

async function logToPicard(event) {
  await fetch(PICARD_WEBHOOK, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      type: event.type,
      timestamp: new Date().toISOString(),
      agent_id: "claude-web-001",
      session_id: SESSION_ID,
      task_id: event.task_id,
      metadata: event.metadata
    })
  });
}

// Log when starting task
await logToPicard({
  type: "task.claimed",
  task_id: "task_123",
  metadata: {task_name: "Build feature"}
});
```

---

### Strategy 2: Browser Extension Bridge

**How it works**: Browser extension intercepts cloud agent activity

```
Cloud Agent (Web UI)
    ↓
Browser Extension (monitors activity)
    ↓
POST to localhost:8765
    ↓
PICARD
```

**Browser Extension** (Chrome/Firefox):
```javascript
// content-script.js
// Inject into claude.ai/code or cursor.com

// Monitor for agent actions
const observer = new MutationObserver(() => {
  // Detect when agent writes code, runs commands, etc.
  const codeBlocks = document.querySelectorAll('.code-block');

  codeBlocks.forEach(block => {
    if (!block.dataset.picardLogged) {
      fetch('http://localhost:8765/events', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          type: 'action.file_write',
          timestamp: new Date().toISOString(),
          agent_id: 'claude-web-001',
          metadata: {
            file_path: extractFilePath(block),
            lines_added: countLines(block)
          }
        })
      });

      block.dataset.picardLogged = 'true';
    }
  });
});

observer.observe(document.body, {childList: true, subtree: true});
```

---

### Strategy 3: Shared File System (Git-Based)

**How it works**: Cloud agent commits to GitHub, local watcher ingests

```
Cloud Agent
    ↓ (git commit)
GitHub Repository
    ↓ (webhook)
Local Git Watcher
    ↓ (parse commits)
PICARD Event Emission
```

**Setup**:
```bash
# Install webhook receiver
npm install -g smee-client

# Start webhook proxy
smee --url https://smee.io/YOUR_CHANNEL --target http://localhost:8766

# Configure GitHub webhook:
# URL: https://smee.io/YOUR_CHANNEL
# Events: push, pull_request
```

**Git Watcher**:
```bash
#!/usr/bin/env bash
# ~/.dev/orchestration/bridges/git-watcher.sh

# Watch for commits
while true; do
  git pull --quiet

  # Parse last commit for agent activity
  LAST_COMMIT=$(git log -1 --pretty=format:'%an|%s|%b')

  if [[ "$LAST_COMMIT" == *"Generated with Claude Code"* ]]; then
    # Extract agent info and emit event
    ~/.dev/scripts/event-emit task.completed \
      --agent claude-web-001 \
      --metadata "{\"commit\":\"$(git rev-parse HEAD)\"}"
  fi

  sleep 30
done
```

---

### Strategy 4: API Polling

**How it works**: Poll cloud platform's API for agent activity

```
PICARD Poller (runs locally)
    ↓ (every 30s)
Cloud Platform API
    ↓ (fetch recent activity)
Parse & Emit Events
    ↓
PICARD Database
```

**Example** (GitHub Copilot):
```python
# ~/.dev/orchestration/bridges/github-copilot-poller.py

import requests
import time

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
API_URL = "https://api.github.com/user/copilot/usage"

while True:
    # Fetch Copilot usage
    resp = requests.get(API_URL, headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}"
    })

    usage = resp.json()

    # Emit event
    subprocess.run([
        "~/.dev/scripts/event-emit", "metric.performance",
        "--agent", "github-copilot-001",
        "--metadata", json.dumps({
            "suggestions_shown": usage.get("suggestions_shown"),
            "suggestions_accepted": usage.get("suggestions_accepted")
        })
    ])

    time.sleep(300)  # Every 5 minutes
```

---

### Strategy 5: Manual Logging (Simplest)

**How it works**: You manually log when cloud agent completes work

```bash
# After cloud agent (Claude Web) completes a task
dev event emit task.completed \
  --agent claude-web-001 \
  --task task_123 \
  --metadata '{"outcome":"success","files_modified":5}'
```

**Or create alias**:
```bash
alias log-claude-web="dev event emit task.completed --agent claude-web-001"

# Usage:
log-claude-web --task task_123 --metadata '{"outcome":"success"}'
```

---

## Recommended Setup by Platform

### Claude Code (Web - claude.ai/code)

**Option 1: Browser Extension** (Best)
- Monitors activity automatically
- POSTs events to localhost:8765

**Option 2: Manual Logging**
```bash
# After Claude Web completes work
dev event emit task.completed --agent claude-web-001 --metadata '{...}'
```

### Cursor Composer (Cloud)

**Option 1: Cursor API** (if available)
```python
# Poll Cursor API for activity
# Emit events to PICARD
```

**Option 2: Git Watcher**
- Cursor commits to GitHub
- Local watcher parses commits
- Emits events

### GitHub Copilot Workspace

**Option 1: GitHub Webhooks**
- Configure webhook on your repos
- Receive push events
- Parse for Copilot activity

**Option 2: GitHub API Polling**
```python
# Poll GitHub Copilot usage API
# Track suggestions, acceptances
```

### Replit Agent

**Option 1: Replit Webhooks**
- Configure deployment webhook
- POST to your PICARD tunnel

**Option 2: Replit API**
- Poll for deployments
- Emit events

---

## Security Considerations

### Local Tunnels (cloudflared, ngrok, localtunnel)

⚠️ **Security Risks**:
- Exposes localhost to internet
- Anyone with URL can POST events
- No authentication by default

✅ **Mitigations**:
1. **Add authentication** to event collector
2. **Use API keys** in webhook URL
3. **Validate event signatures**
4. **Use temporary tunnels** (close when not needed)
5. **Whitelist IPs** if possible

### Webhook Authentication

Update event collector:
```python
# ~/.dev/observability/event-collector.py

WEBHOOK_SECRET = os.getenv("PICARD_WEBHOOK_SECRET")

def do_POST(self):
    # Verify signature
    signature = self.headers.get('X-Picard-Signature')
    if not verify_signature(signature, WEBHOOK_SECRET):
        self.send_response(403)
        return

    # Process event...
```

---

## Complete Cloud Setup Example

### For Claude Code (Web)

**1. Start PICARD with tunnel**:
```bash
# Terminal 1: Event collector
~/.dev/observability/event-collector.py

# Terminal 2: Cloudflare tunnel
cloudflared tunnel --url http://localhost:8765

# Note the URL: https://random-xyz.trycloudflare.com
```

**2. Browser Extension** (manual for now):
```javascript
// Create bookmarklet or extension
javascript:(function(){
  const webhook = "https://your-tunnel.trycloudflare.com/events";

  // Log current task
  fetch(webhook, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      type: 'task.completed',
      timestamp: new Date().toISOString(),
      agent_id: 'claude-web-001',
      task_id: prompt('Task ID:'),
      metadata: {
        outcome: 'success',
        platform: 'claude-web'
      }
    })
  }).then(() => alert('Logged to PICARD!'));
})();
```

Save as bookmark, click when Claude Web completes a task.

**3. Monitor in PICARD**:
```bash
# Terminal 3
picard

# See claude-web-001 appear in agent fleet!
```

---

## Future: Native Cloud Integrations

PICARD v1.1 will include:
- Native browser extension
- OAuth authentication for platforms
- Automatic activity detection
- No manual logging needed

---

## Quick Reference

| Platform | Best Method | Complexity |
|----------|-------------|------------|
| Claude Web | Browser ext / Manual | Medium / Easy |
| Cursor Cloud | Git watcher / API | Medium |
| GitHub Copilot | Webhooks / API | Easy |
| Replit | Webhooks | Easy |
| Codex Cloud | API polling | Medium |

---

**🖖 Cloud agents can now report to PICARD!**

Start with **manual logging**, then upgrade to **webhooks/extensions** as needed.
