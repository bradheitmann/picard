# Agent Event Stream Specification

**Version**: 1.0.0
**Last Updated**: 2025-11-14

---

## Overview

The Agent Event Stream is a standardized telemetry system for tracking all AI agent activity across multiple platforms in real-time.

### Key Concepts

- **Events**: Structured messages agents emit during operations
- **Event Stream**: Append-only log of all events (JSONL format)
- **Hooks**: Pre/post callbacks triggered by events
- **Teams**: Groups of agents working together
- **Observability**: Real-time monitoring and metrics

---

## Event Types

### 1. Lifecycle Events

```json
{
  "type": "agent.started",
  "timestamp": "2025-11-14T12:34:56.789Z",
  "agent_id": "claude-code-001",
  "agent_name": "Claude Code",
  "platform": "claude-code",
  "team_id": "team-alpha",
  "project": "your-project-name",
  "session_id": "sess_abc123",
  "metadata": {
    "version": "1.0.0",
    "capabilities": ["read", "write", "edit", "bash"]
  }
}
```

```json
{
  "type": "agent.stopped",
  "timestamp": "2025-11-14T13:45:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "metadata": {
    "duration_ms": 4203211,
    "tasks_completed": 5,
    "files_modified": 12
  }
}
```

### 2. Task Events

```json
{
  "type": "task.claimed",
  "timestamp": "2025-11-14T12:35:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "project": "your-project-name",
  "team_id": "team-alpha",
  "metadata": {
    "task_name": "Implement authentication",
    "priority": "high",
    "estimated_duration_ms": 1800000
  }
}
```

```json
{
  "type": "task.progress",
  "timestamp": "2025-11-14T12:40:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "metadata": {
    "progress_pct": 45,
    "current_step": "Writing tests",
    "files_modified": 3
  }
}
```

```json
{
  "type": "task.completed",
  "timestamp": "2025-11-14T13:05:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "metadata": {
    "duration_ms": 1800000,
    "outcome": "success",
    "files_modified": 8,
    "tests_added": 4,
    "lines_changed": 342
  }
}
```

```json
{
  "type": "task.failed",
  "timestamp": "2025-11-14T13:05:00.000Z",
  "agent_id": "cursor-002",
  "session_id": "sess_def456",
  "task_id": "task_abc123",
  "metadata": {
    "duration_ms": 600000,
    "error": "Build failed",
    "error_details": "TypeScript errors in auth.ts"
  }
}
```

### 3. Action Events

```json
{
  "type": "action.file_read",
  "timestamp": "2025-11-14T12:36:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "metadata": {
    "file_path": "src/auth/Login.tsx",
    "file_size_bytes": 2048,
    "lines": 84
  }
}
```

```json
{
  "type": "action.file_write",
  "timestamp": "2025-11-14T12:37:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "metadata": {
    "file_path": "src/auth/LoginForm.tsx",
    "action": "created",
    "lines_added": 120,
    "file_size_bytes": 3840
  }
}
```

```json
{
  "type": "action.file_edit",
  "timestamp": "2025-11-14T12:38:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "metadata": {
    "file_path": "src/App.tsx",
    "lines_added": 5,
    "lines_removed": 2,
    "hunks": 1
  }
}
```

```json
{
  "type": "action.bash_command",
  "timestamp": "2025-11-14T12:40:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz789",
  "metadata": {
    "command": "npm test",
    "exit_code": 0,
    "duration_ms": 5432,
    "output_lines": 24
  }
}
```

### 4. Coordination Events

```json
{
  "type": "agent.message",
  "timestamp": "2025-11-14T12:45:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "metadata": {
    "to_agent": "trae-003",
    "message_type": "handoff",
    "message": "Authentication complete. Ready for integration testing."
  }
}
```

```json
{
  "type": "conflict.detected",
  "timestamp": "2025-11-14T12:50:00.000Z",
  "agent_id": "cursor-002",
  "session_id": "sess_ghi789",
  "metadata": {
    "conflict_with": "claude-code-001",
    "conflict_type": "file_edit",
    "file_path": "src/auth/Login.tsx",
    "resolution": "deferred"
  }
}
```

### 5. Metric Events

```json
{
  "type": "metric.performance",
  "timestamp": "2025-11-14T12:55:00.000Z",
  "agent_id": "claude-code-001",
  "session_id": "sess_abc123",
  "metadata": {
    "metric_name": "task_completion_rate",
    "value": 0.92,
    "unit": "ratio",
    "window_size_ms": 3600000
  }
}
```

---

## Event Structure

### Required Fields

All events MUST include:

```typescript
{
  type: string;              // Event type (e.g., "agent.started")
  timestamp: string;         // ISO-8601 timestamp
  agent_id: string;          // Unique agent identifier
  session_id: string;        // Session identifier
}
```

### Optional Fields

```typescript
{
  task_id?: string;          // Associated task
  project?: string;          // Project name
  team_id?: string;          // Team identifier
  metadata?: object;         // Event-specific data
}
```

---

## Event Streams

### Global Stream

All events across all agents:
- **Location**: `~/.dev/logs/events/global-stream.jsonl`
- **Retention**: Unlimited (or configurable)
- **Format**: JSONL (newline-delimited JSON)

### Per-Agent Stream

Events for a specific agent:
- **Location**: `~/.dev/logs/events/agents/[agent-id]-stream.jsonl`
- **Retention**: Unlimited
- **Format**: JSONL

### Per-Team Stream

Events for a team of agents:
- **Location**: `~/.dev/logs/events/teams/[team-id]-stream.jsonl`
- **Retention**: Unlimited
- **Format**: JSONL

### Per-Project Stream

Events for a specific project:
- **Location**: `[project]/docs/EVENT_STREAM.jsonl`
- **Retention**: Project lifetime
- **Format**: JSONL

---

## Hooks

### Hook Types

1. **Pre-Hooks**: Run before an action
2. **Post-Hooks**: Run after an action
3. **Event-Hooks**: Triggered by specific events

### Hook Definition

```yaml
# ~/.dev/observability/hooks/config.yaml

hooks:
  - name: "log-to-slack"
    trigger: "task.completed"
    condition: "metadata.outcome == 'success'"
    action: "bash"
    command: "~/.dev/observability/hooks/slack-notify.sh"

  - name: "update-dashboard"
    trigger: "*"
    action: "internal"
    handler: "refresh_tui"

  - name: "harvest-insights"
    trigger: "task.completed"
    condition: "metadata.outcome == 'success'"
    action: "bash"
    command: "~/.dev/scripts/harvest-insights"
```

---

## Teams

### Team Definition

```yaml
# ~/.dev/observability/teams/team-alpha.yaml

id: "team-alpha"
name: "Team Alpha - Frontend Development"
description: "React/TypeScript/Tailwind specialists"

agents:
  - agent_id: "claude-code-001"
    role: "lead"
    capabilities: ["react", "typescript", "tailwind"]

  - agent_id: "cursor-002"
    role: "specialist"
    capabilities: ["component-library", "testing"]

  - agent_id: "trae-003"
    role: "qa"
    capabilities: ["testing", "review"]

coordination:
  strategy: "leader-followers"
  conflict_resolution: "leader-decides"

communication:
  enabled: true
  channel: "team-alpha-stream"
```

---

## Real-Time Observability

### Event Collection

Events are written to JSONL files immediately:

```bash
# Append event
echo '{"type":"agent.started",...}' >> ~/.dev/logs/events/global-stream.jsonl
```

### Event Consumption

Watch for new events:

```bash
# Tail the stream
tail -f ~/.dev/logs/events/global-stream.jsonl
```

### TUI Dashboard

Real-time terminal dashboard shows:
- Active agents across all platforms
- Current tasks and progress
- Recent events
- Team status
- Metrics

```bash
dev observe           # Launch TUI dashboard
dev observe --team team-alpha  # Team-specific view
```

---

## Integration

### From Claude Code

```typescript
// Emit event
const event = {
  type: "task.claimed",
  timestamp: new Date().toISOString(),
  agent_id: "claude-code-001",
  session_id: process.env.SESSION_ID,
  task_id: "task_123",
  metadata: { task_name: "Implement auth" }
};

fs.appendFileSync(
  `${process.env.HOME}/.dev/logs/events/global-stream.jsonl`,
  JSON.stringify(event) + '\n'
);
```

### From Cursor/Trae/Other Agents

Same append-only pattern:

```python
# Python example
import json
from datetime import datetime
from pathlib import Path

event = {
    "type": "action.file_write",
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "agent_id": "cursor-002",
    "session_id": os.getenv("SESSION_ID"),
    "metadata": {"file_path": "src/component.tsx"}
}

stream_path = Path.home() / ".dev/logs/events/global-stream.jsonl"
with open(stream_path, 'a') as f:
    f.write(json.dumps(event) + '\n')
```

### Via Dev Hub CLI

```bash
# Quick event emission
dev event emit agent.started --agent claude-code-001 --metadata '{"version":"1.0.0"}'

# Or use the agent log (backwards compatible)
dev agent log my-agent "Task completed" # Generates task.completed event
```

---

## Metrics & Aggregation

### Built-in Metrics

- **Tasks per hour**: Completed tasks / time window
- **Agent utilization**: Active time / total time
- **Conflict rate**: Conflicts / total tasks
- **Success rate**: Successful tasks / total tasks
- **Avg task duration**: Mean completion time

### Custom Metrics

Define in `~/.dev/observability/metrics.yaml`:

```yaml
metrics:
  - name: "frontend_velocity"
    description: "Frontend tasks completed per day"
    query: "type == 'task.completed' AND project LIKE 'frontend%'"
    aggregation: "count"
    window: "1d"

  - name: "test_coverage_trend"
    description: "Test coverage over time"
    query: "type == 'metric.performance' AND metadata.metric_name == 'test_coverage'"
    aggregation: "avg"
    window: "7d"
```

---

## Security & Privacy

### Event Filtering

Sensitive data should NOT be logged:
- API keys
- Passwords
- Personal information
- Proprietary code (file paths OK, contents NO)

### Access Control

Event streams are readable by:
- Current user only (file permissions: 600)
- No network exposure by default

---

## Version History

### v1.0.0 - 2025-11-14
- Initial event specification
- Lifecycle, task, action, coordination, metric events
- Hooks system design
- Team coordination model
- Real-time observability architecture
