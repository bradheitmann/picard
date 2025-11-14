# Agent Orchestration Platform - Architecture

**Version**: 1.0.0
**Last Updated**: 2025-11-14

---

## Overview

A unified control plane for deploying, activating, monitoring, and orchestrating AI agents across multiple platforms from a single interface.

### Supported Platforms

- **Claude Code** - Anthropic's Claude in VS Code
- **Cursor** - AI-first code editor
- **Codex** - OpenAI Codex integration
- **Warp** - AI-powered terminal
- **Zed** - Collaborative code editor
- **GitHub** - GitHub Actions, Copilot
- **Trae** - AI coding assistant
- **Kilocode** - Agent platform
- **Droid** - Mobile/cross-platform agents
- **OpenCode** - Open-source coding agents
- **Gemini CLI** - Google Gemini terminal interface
- **Custom** - Any platform with API/CLI access

---

## Architecture Components

### 1. Control Plane (User Interface)

**Location**: `~/.dev/orchestration/`

Central command center for:
- Deploying agents to platforms
- Viewing agent status across all platforms
- Distributing tasks to agents
- Monitoring health and performance
- Managing agent lifecycle

**Access**:
```bash
dev orchestrate        # Main orchestration dashboard
dev deploy             # Deploy agents
dev monitor            # Real-time monitoring
```

### 2. Agent Registry

**Location**: `~/.dev/agents/AGENT_REGISTRY.yaml`

Defines all constitutional agents with:
- Agent identity and version
- Capabilities and skills
- Platform compatibility
- Deployment configuration

### 3. Platform Bridges

**Location**: `~/.dev/orchestration/bridges/`

Adapters for each platform that handle:
- Agent deployment
- Task submission
- Status polling
- Event collection
- Health checks

**Bridge Interface**:
```yaml
bridge:
  name: "claude-code"
  type: "native"              # native, api, cli, webhook
  capabilities:
    - deploy_agent
    - submit_task
    - get_status
    - stream_events
  authentication:
    method: "filesystem"      # filesystem, api_key, oauth, none
  deployment:
    method: "file_copy"       # file_copy, api_call, webhook
    target: ".claude/"
```

### 4. Task Queue

**Location**: SQLite database + Redis (optional)

Distributed task queue for:
- Task submission from any source
- Intelligent agent selection
- Load balancing
- Priority management
- Retry logic

### 5. Event Collection

**Location**: `~/.dev/observability/`

Centralized event ingestion:
- HTTP/WebSocket server
- File watchers for JSONL streams
- SQLite database storage
- Real-time broadcast to dashboards

### 6. Deployment Manifests

**Location**: `~/.dev/orchestration/manifests/`

Declarative deployment specifications:
```yaml
deployment:
  name: "frontend-dev-team"
  agents:
    - agent: "claude-code-frontend"
      platform: "claude-code"
      count: 1
    - agent: "cursor-specialist"
      platform: "cursor"
      count: 1
  tasks:
    - task_type: "component-development"
      assign_to: "claude-code-frontend"
    - task_type: "code-review"
      assign_to: "cursor-specialist"
  coordination:
    strategy: "leader-follower"
    leader: "claude-code-frontend"
```

---

## Deployment Flow

### Step 1: Define Agent

```bash
~/.dev/scripts/agent-create
# Creates constitution, prompts, registers in AGENT_REGISTRY.yaml
```

### Step 2: Create Deployment Manifest

```yaml
# ~/.dev/orchestration/manifests/my-deployment.yaml
deployment:
  name: "my-deployment"
  agents:
    - agent_id: "my-agent-001"
      platform: "claude-code"
      project: "/path/to/project"
      auto_activate: true
```

### Step 3: Deploy

```bash
dev deploy --manifest my-deployment.yaml
```

**What Happens**:
1. Reads manifest and agent configuration
2. Validates platform compatibility
3. Calls platform bridge to deploy agent
4. Creates session in database
5. Starts event collection
6. Monitors agent activation
7. Reports status

### Step 4: Monitor

```bash
dev monitor             # TUI dashboard
dev status              # Quick status
dev agents              # Detailed agent view
```

### Step 5: Task Distribution

```bash
dev task assign --task "Implement auth" --agent my-agent-001
# Or automatic assignment based on capabilities
dev task create --type "frontend" --auto-assign
```

### Step 6: Observe

```bash
dev observe             # Real-time event stream
dev logs my-agent-001   # Agent-specific logs
dev metrics my-agent-001 # Agent metrics
```

---

## Platform Bridges

### Claude Code Bridge

**Method**: File-based integration

**Deployment**:
1. Copy agent constitution to `.claude/agents/[agent-id].md`
2. Copy custom commands to `.claude/commands/`
3. Add hooks to `.claude/hooks/`
4. Notify Claude Code via file watcher

**Task Submission**:
1. Write task to `.claude/tasks/[task-id].yaml`
2. Claude Code reads and claims task
3. Emits events via hook system

**Event Collection**:
1. Claude Code emits to `~/.dev/logs/events/global-stream.jsonl`
2. Or POSTs to collection server
3. Events stored in SQLite

### Cursor Bridge

**Method**: Extension + API

**Deployment**:
1. Install Cursor extension (if available)
2. Configure via `cursor-agent-config.json`
3. Extension loads agent constitution
4. Establishes WebSocket connection to orchestrator

**Task Submission**:
- POST to Cursor extension API
- Or write to watched directory

**Event Collection**:
- WebSocket stream to collection server
- Or JSONL append

### Warp Bridge

**Method**: Warp Workflows + Scripts

**Deployment**:
1. Copy agent scripts to `~/.warp/agents/[agent-id]/`
2. Create Warp workflows
3. Register keyboard shortcuts

**Task Submission**:
- CLI command: `warp-agent execute --task [task-id]`
- Or Warp workflow trigger

**Event Collection**:
- Bash scripts append to JSONL
- Or POST to collection server

### GitHub Bridge

**Method**: GitHub Actions + App

**Deployment**:
1. Create GitHub App with agent identity
2. Install app on repositories
3. Deploy workflows to `.github/workflows/agent-[agent-id].yml`

**Task Submission**:
- Trigger workflow via dispatch event
- Pass task as workflow inputs

**Event Collection**:
- Workflow posts to webhook
- Orchestrator ingests events

### API/CLI Bridges (Generic)

For platforms with API/CLI:

**Deployment**:
1. Call platform API/CLI to register agent
2. Upload agent configuration
3. Set webhook for events

**Task Submission**:
- API call or CLI command

**Event Collection**:
- Webhook receiver
- Or polling API

---

## Task Distribution

### Task Queue Schema

```sql
CREATE TABLE task_queue (
  task_id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  assigned_agent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  claimed_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  task_data_json TEXT,
  requirements_json TEXT,
  result_json TEXT
);
```

### Assignment Strategies

**1. Manual Assignment**
```bash
dev task assign --task task-123 --agent my-agent-001
```

**2. Auto-Assignment by Capability**
```bash
dev task create --type "frontend-component" --auto-assign
# Finds agent with "react" + "typescript" capabilities
```

**3. Load Balancing**
```bash
dev task create --type "testing" --strategy round-robin
# Distributes across available agents
```

**4. Leader-Follower**
```yaml
team:
  leader: "claude-code-001"
  followers: ["cursor-002", "trae-003"]
# Leader assigns sub-tasks to followers
```

---

## Agent Lifecycle Management

### States

1. **Defined** - Agent created, not yet deployed
2. **Deploying** - Deployment in progress
3. **Active** - Deployed and running
4. **Idle** - Deployed but not working on tasks
5. **Busy** - Working on task(s)
6. **Error** - Malfunctioning or unreachable
7. **Suspended** - Temporarily paused
8. **Terminated** - Stopped and removed

### Lifecycle API

```bash
# Deploy agent to platform
dev agent deploy --agent my-agent-001 --platform claude-code --project /path/to/project

# Start agent (if not auto-activated)
dev agent start my-agent-001

# Pause agent
dev agent pause my-agent-001

# Resume agent
dev agent resume my-agent-001

# Stop agent
dev agent stop my-agent-001

# Remove agent from platform
dev agent terminate my-agent-001

# Agent health check
dev agent health my-agent-001

# Agent diagnostics
dev agent diagnose my-agent-001
```

---

## Monitoring & Observability

### Real-Time Dashboard

TUI showing:
- All deployed agents across platforms
- Current status (active, idle, busy, error)
- Active tasks per agent
- Recent events
- Health scores
- Resource usage (tokens, tool calls)

```bash
dev monitor
```

**Dashboard Sections**:
1. **Agent Grid** - Visual grid of all agents
2. **Task Queue** - Pending/active tasks
3. **Event Stream** - Live event feed
4. **Metrics** - Performance KPIs
5. **Alerts** - Issues and warnings

### Health Monitoring

**Health Checks**:
- Event freshness (last event < 5 min)
- Error rate (< 5%)
- Task completion rate (> 80%)
- Response time (< reasonable threshold)
- Token usage (within budget)

**Anomaly Detection**:
- Sudden spike in errors
- No events for extended period
- Excessive token usage
- Tool invocation failures
- Task timeout patterns

**Alerts**:
```yaml
alerts:
  - type: "agent_down"
    condition: "no events in 10 minutes"
    severity: "critical"
    action: "notify + auto-restart"

  - type: "high_error_rate"
    condition: "error_rate > 0.20"
    severity: "warning"
    action: "notify"

  - type: "token_budget_exceeded"
    condition: "daily_tokens > budget"
    severity: "error"
    action: "suspend_agent + notify"
```

---

## Configuration

### Global Config

```yaml
# ~/.dev/orchestration/config.yaml

orchestration:
  event_collection_server:
    enabled: true
    host: "localhost"
    port: 8765
    protocol: "http"  # http, websocket

  task_queue:
    backend: "sqlite"  # sqlite, redis
    retry_limit: 3
    timeout_seconds: 3600

  monitoring:
    health_check_interval_seconds: 60
    alert_threshold_error_rate: 0.15

  platforms:
    claude_code:
      enabled: true
      bridge: "filesystem"
      config_path: ".claude/"

    cursor:
      enabled: true
      bridge: "extension"
      extension_port: 9876

    warp:
      enabled: true
      bridge: "cli"

    github:
      enabled: true
      bridge: "actions"
      app_id: "your-github-app-id"

    # ... other platforms
```

---

## Security

### Authentication

**Platform Access**:
- API keys stored in `~/.dev/secrets/`
- Encrypted at rest
- Never logged in events

**Agent Identity**:
- Each agent has unique ID
- Platform-specific credentials
- Rotation support

### Authorization

**Role-Based Access**:
- Admin: Full control
- Operator: Deploy, start, stop
- Observer: Read-only access

**Audit Trail**:
- All deployment actions logged
- Agent lifecycle changes tracked
- Task assignments recorded

---

## Fault Tolerance

### Agent Failures

**Detection**:
- Health check failures
- Event stream silence
- Explicit error events

**Recovery**:
1. Log failure to database
2. Create alert
3. Attempt restart (if configured)
4. Reassign tasks to other agents
5. Notify operator if persistent

### Task Failures

**Handling**:
1. Capture error details
2. Retry with same agent (up to limit)
3. Reassign to different agent
4. Mark as failed if exhausted
5. Notify operator

### Platform Outages

**Detection**:
- Bridge health checks fail
- Multiple agents on platform go silent

**Response**:
1. Mark platform as degraded
2. Stop deploying to platform
3. Reassign pending tasks to other platforms
4. Alert operator

---

## Extensibility

### Adding New Platforms

1. **Create Bridge**:
```bash
cp ~/.dev/orchestration/bridges/template.sh \
   ~/.dev/orchestration/bridges/new-platform.sh
```

2. **Implement Interface**:
   - `deploy_agent(agent_id, config)`
   - `submit_task(task_id, agent_id)`
   - `get_status(agent_id)`
   - `collect_events()`
   - `health_check(agent_id)`

3. **Register in Config**:
```yaml
platforms:
  new_platform:
    enabled: true
    bridge: "new-platform"
```

4. **Test**:
```bash
dev bridge test new-platform
```

### Custom Task Types

Define in `~/.dev/orchestration/task-types.yaml`:
```yaml
task_types:
  - name: "custom-analysis"
    required_capabilities: ["analysis", "reporting"]
    default_timeout_seconds: 1800
    default_priority: 5
```

---

## Roadmap

### Phase 1 (Current)
- ✅ Architecture design
- ✅ SQLite schema
- ✅ Event specification
- ⏳ Platform bridges (file-based)
- ⏳ Basic deployment
- ⏳ TUI dashboard

### Phase 2 (Next)
- Event collection HTTP server
- Enhanced TUI with rich formatting
- GitHub Actions bridge
- API/CLI generic bridge
- Task queue with auto-assignment

### Phase 3 (Future)
- WebSocket real-time events
- Web-based dashboard
- Multi-user support
- Distributed deployment
- Cloud platform support

---

## Getting Started

### 1. Initialize Database

```bash
sqlite3 ~/.dev/logs/observability.db < ~/.dev/observability/schema.sql
```

### 2. Configure Platforms

Edit `~/.dev/orchestration/config.yaml`

### 3. Create Your First Agent

```bash
~/.dev/scripts/agent-create
```

### 4. Deploy Agent

```bash
dev deploy --agent my-agent-001 --platform claude-code
```

### 5. Monitor

```bash
dev monitor
```

---

## References

- **Event Spec**: `~/.dev/observability/EVENT_SPEC.md`
- **Database Schema**: `~/.dev/observability/schema.sql`
- **Agent Registry**: `~/.dev/agents/AGENT_REGISTRY.yaml`
- **Platform Bridges**: `~/.dev/orchestration/bridges/`

---

**Vision**: One dashboard to rule them all. Deploy anywhere, observe everywhere.
