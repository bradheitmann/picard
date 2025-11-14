# 🖖 PICARD

**Project Intelligence, Coordination, And Resource Deployment**

*"Make it so."*

---

## Overview

PICARD is a production-grade **multi-agent orchestration platform** for coordinating AI coding agents across multiple platforms. Deploy, monitor, and optimize specialized agent teams to scale your software development.

### What is PICARD?

Think of PICARD as **mission control for AI agents**:

- 🚀 **Deploy** agents to 11+ platforms (Claude Code, Cursor, Warp, GitHub, etc.)
- 👥 **Coordinate** specialized teams (Frontend, Backend, Testing, Review, Docs)
- 📊 **Monitor** everything in real-time with beautiful TUI dashboard
- 💰 **Track ROI** (cost per task, lines per dollar, token efficiency)
- 🧠 **Optimize** context usage and quality
- 🎯 **Enforce** quality gates automatically
- 📚 **Harvest** insights from every project

---

## Features

### Multi-Platform Agent Deployment

Deploy agents to:
- Claude Code
- Cursor
- Codex
- Warp
- Zed
- GitHub Actions
- Trae
- Kilocode
- Droid
- OpenCode
- Gemini CLI
- Any platform with API or CLI

### Real-Time Observability

Beautiful TUI dashboard shows:
- Active agents across platforms
- Task queue with priorities
- ROI metrics (cost, output, efficiency)
- Context usage per agent
- Quality gate status
- Live event stream

### Constitutional Agent System

Agents with:
- Versioned constitutions (principles, constraints)
- Specialized roles and capabilities
- Cost and context budgets
- Quality gates and checks
- Versioned prompts and workflows

### Comprehensive Tracking

- Every tool invocation logged
- Token usage and costs tracked
- Agent health monitoring
- Conflict detection
- Automated alerts

---

## Installation

### Prerequisites

- Python 3.9+
- SQLite3
- jq, fzf (optional, for enhanced experience)

### Quick Install

```bash
# Clone repository
git clone https://github.com/bradheitmann/picard.git
cd picard

# Run installer
./install.sh

# Reload shell
source ~/.zshrc

# Verify
picard --version
dev help
```

### Manual Install

```bash
# Create directory
mkdir -p ~/.dev
cp -r * ~/.dev/

# Add to PATH
echo 'export PATH="$HOME/.dev/scripts:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Install Python dependencies
pip3 install --user rich textual

# Initialize database
sqlite3 ~/.dev/logs/observability.db < ~/.dev/observability/schema.sql
```

---

## Quick Start

### Just Type One Command

```bash
picard
```

**That's it!** PICARD auto-starts the event collector if needed.

### Deploy Your First Agent

```bash
# Terminal 3
cd /path/to/your/project
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"
```

### 3. Create & Assign Tasks

```bash
dev task create --type "feature" --name "Build authentication"
dev task assign --task task_XXX --agent claude-code-001
```

**Watch PICARD** - See everything happen in real-time!

---

## Architecture

```
User Commands (dev CLI)
         ↓
Orchestration Engine
    ├── Task Queue
    ├── Event Collector (HTTP Server)
    └── SQLite Database
         ↓
Platform Bridges
    ├── Claude Code
    ├── Cursor
    ├── Warp
    └── GitHub (+ more)
         ↓
Deployed Agent Instances
         ↓
Events → Database → PICARD Dashboard (Real-time TUI)
```

---

## Core Commands

```bash
# Launch PICARD Dashboard
picard

# Main CLI
dev                      # Interactive menu
dev help                 # All commands

# Deploy agents
dev deploy --agent <id> --platform <name> --project <path>
dev team deploy --manifest <file>

# Manage tasks
dev task create --type <type> --name <name>
dev task assign --task <id> --agent <id>
dev task list

# Orchestrate teams
dev team create --name <name> --strategy <strategy>
dev team add-agent --team <id> --agent <id> --role <role>

# Monitor
dev status               # Global dashboard
dev agents               # Agent status
```

---

## PICARD Dashboard

```
    ██████╗ ██╗ ██████╗ █████╗ ██████╗ ██████╗
    ██╔══██╗██║██╔════╝██╔══██╗██╔══██╗██╔══██╗
    ██████╔╝██║██║     ███████║██████╔╝██║  ██║
    ██╔═══╝ ██║██║     ██╔══██║██╔══██╗██║  ██║
    ██║     ██║╚██████╗██║  ██║██║  ██║██████╔╝
    ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝

    🖖 Project Intelligence, Coordination, And Resource Deployment 🖖
                        "Make It So"

┌────────────────────────────────────────────────────────────┐
│ 🤖 AGENT FLEET          │ 💰 ROI METRICS                   │
│ ────────────────────    │ ─────────────────                │
│ Agent    | Status       │ Tasks: 12 | Lines: 2,847         │
│ frontend | 🟢 ACTIVE    │ Cost: $3.45 | Lines/$: 825       │
├────────────────────────────────────────────────────────────┤
│ 📋 TASK QUEUE           │ 🎯 QUALITY GATES                 │
│ ────────────────────    │ ─────────────────                │
│ Build UI   | 🔥 CRIT    │ Success: 91.7% | ✓ PASSING       │
└────────────────────────────────────────────────────────────┘
```

---

## Constitutional Agents

Define agents with:

```yaml
agent:
  id: "frontend-specialist-001"
  specialization: [react, typescript, tailwind]
  cost_budget:
    max_usd_per_day: 5.00
  context_budget:
    max_tokens: 100000
    reserved_pct: 30
  quality_gates:
    - no_typescript_errors
    - passes_linter
    - tests_pass
```

Create with: `~/.dev/scripts/agent-create`

---

## ROI Optimization

### Key Metrics

- **Lines per Dollar**: Code delivered per dollar spent
- **Cost per Task**: Average task cost
- **Token Efficiency**: Tokens per output

### Best Practices

1. **Specialize agents** - Lower context = cheaper + faster
2. **Set budgets** - Prevent overspend
3. **Enforce quality** - Avoid rework costs
4. **Monitor context** - Keep usage < 70%

---

## Team Coordination

### Strategies

**Leader-Follower**: One lead coordinates others
```yaml
strategy: "leader-follower"
leader: "frontend-lead"
followers: ["frontend-specialist", "testing-specialist"]
```

**Peer-to-Peer**: Agents collaborate as equals
```yaml
strategy: "peer-to-peer"
```

**Hierarchical**: Multi-level coordination
```yaml
strategy: "hierarchical"
```

---

## Event System

### Event Types

- **Lifecycle**: `agent.started`, `agent.stopped`, `agent.deployed`
- **Tasks**: `task.claimed`, `task.completed`, `task.failed`
- **Actions**: `action.file_write`, `action.bash_command`
- **Coordination**: `agent.message`, `conflict.detected`
- **Metrics**: `token.usage`, `tool.invocation`

### Event Format

```json
{
  "type": "task.completed",
  "timestamp": "2025-11-14T12:34:56.789Z",
  "agent_id": "agent-001",
  "session_id": "sess_abc123",
  "task_id": "task_xyz",
  "metadata": {
    "duration_ms": 120000,
    "outcome": "success",
    "files_modified": 5
  }
}
```

---

## Database Schema

SQLite database tracks:
- Events (all agent activity)
- Agents (registry and stats)
- Sessions (with duration and cost)
- Tasks (with outcomes)
- Tool usage
- Token consumption
- Agent health
- Conflicts
- Teams
- Insights

See: `observability/schema.sql`

---

## Platform Bridges

Adapters for each platform:

```bash
# Bridge interface
bridge.sh deploy <agent-id> <project-path>
bridge.sh submit_task <task-id> <agent-id> <task-data>
bridge.sh status <agent-id>
bridge.sh health <agent-id>
bridge.sh terminate <agent-id>
```

Create custom bridges for your platforms.

---

## Documentation

- **`docs/GETTING_STARTED.md`** - Complete setup guide
- **`docs/ARCHITECTURE.md`** - System architecture
- **`docs/EVENT_SPEC.md`** - Event specification
- **`docs/QUICKSTART.md`** - Deploy teams fast
- **`docs/CHEAT_SHEET.md`** - Command reference

---

## Examples

### Deploy Single Agent

```bash
dev deploy --agent my-agent --platform claude-code --project ~/my-project
```

### Deploy Specialized Team

```bash
# Create team
dev team create --name "Dev Team" --strategy leader-follower

# Add agents
dev team add-agent --team team-dev-team --agent frontend-001 --role lead
dev team add-agent --team team-dev-team --agent backend-001 --role specialist

# Deploy
dev team deploy --manifest manifests/my-team.yaml
```

### Monitor & Optimize

```bash
# Launch PICARD
picard

# Watch metrics:
# - ROI (lines per dollar)
# - Quality gates (pass/fail)
# - Context usage (< 70% target)
# - Agent health
```

---

## Configuration

### Global Config

`~/.dev/config.yaml`:

```yaml
settings:
  default_agent: "claude-code"
  auto_harvest_insights: true
  log_all_agent_activity: true

agents:
  - name: "your-agent"
    type: "ai-assistant"
    active: true
```

### Agent Manifest

`orchestration/manifests/example-team.yaml`:

```yaml
deployment_name: "specialized-dev-team"

team:
  id: "team-alpha"
  strategy: "leader-follower"

agents:
  - id: "frontend-specialist"
    specialization: [react, typescript, tailwind]
    cost_budget:
      max_usd_per_day: 5.00
    quality_gates:
      - no_typescript_errors
      - tests_pass
```

---

## Use Cases

- **Startup MVPs**: Deploy team to ship faster
- **Enterprise Projects**: Multi-team coordination
- **Open Source**: Community contributor agents
- **DevOps**: Automated quality enforcement
- **Cost Optimization**: Track and optimize AI spend
- **Knowledge Management**: Harvest insights from development

---

## Roadmap

### v1.0 (Current)
- ✅ Core orchestration engine
- ✅ SQLite event storage
- ✅ PICARD TUI dashboard
- ✅ Platform bridges framework
- ✅ Task queue
- ✅ ROI tracking

### v1.1 (Planned)
- WebSocket real-time events
- Enhanced team coordination
- Auto-assignment by capability
- Web dashboard (browser-based)
- More platform bridges
- Advanced analytics

### v2.0 (Future)
- Multi-user support
- Cloud deployment
- Enterprise features
- Advanced ML insights
- Cost prediction
- Marketplace for agents

---

## Contributing

Contributions welcome! See `CONTRIBUTING.md`.

Areas needing help:
- Platform bridges (Cursor, Zed, etc.)
- Enhanced TUI features
- Web dashboard
- Analytics and insights
- Documentation
- Testing

---

## License

MIT License - see `LICENSE`

---

## Author

**Bradley Heitmann**
- GitHub: [@bradheitmann](https://github.com/bradheitmann)
- Built with Claude Code

---

## Acknowledgments

- Inspired by DevOps, MLOps, and agent observability best practices
- Built with: Python, Rich, Textual, SQLite
- Community research from HN, Reddit, YouTube

---

## Support

- **Documentation**: `docs/`
- **Issues**: [GitHub Issues](https://github.com/bradheitmann/picard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bradheitmann/picard/discussions)

---

## Quick Links

- [Installation Guide](docs/GETTING_STARTED.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Examples](examples/)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

**🖖 PICARD v1.0.0**
*Deploy Anywhere. Observe Everywhere. Optimize Everything.*

**Make it so!** 🚀
