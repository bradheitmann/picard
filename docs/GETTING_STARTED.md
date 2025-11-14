# Getting Started with PICARD

**🖖 Welcome to Project Intelligence, Coordination, And Resource Deployment**

This guide will help you install and deploy your first multi-agent team.

---

## Installation

### Quick Install

```bash
# Clone repository
git clone https://github.com/bradheitmann/picard.git
cd picard

# Run installer
./install.sh

# Reload shell
source ~/.zshrc
```

### Verify Installation

```bash
# Check commands
which picard
which dev

# Should output:
# /Users/YOUR_USERNAME/.dev/scripts/picard
# /Users/YOUR_USERNAME/.dev/scripts/dev
```

---

## First Run (5 Minutes)

### 1. Start Event Collector

```bash
# Terminal 1
~/.dev/observability/event-collector.py

# Should show:
# ✓ Event Collection Server running on localhost:8765
```

**Keep this terminal running!**

### 2. Launch PICARD Dashboard

```bash
# Terminal 2
picard
```

You'll see the beautiful TUI dashboard:
```
    ██████╗ ██╗ ██████╗ █████╗ ██████╗ ██████╗
    ██╔══██╗██║██╔════╝██╔══██╗██╔══██╗██╔══██╗
    ██████╔╝██║██║     ███████║██████╔╝██║  ██║
    ██╔═══╝ ██║██║     ██╔══██║██╔══██╗██║  ██║
    ██║     ██║╚██████╗██║  ██║██║  ██║██████╔╝
    ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝

    🖖 Project Intelligence, Coordination, And Resource Deployment 🖖
                        "Make It So"
```

**Keep this visible!** This is your command center.

### 3. Deploy Your First Agent

```bash
# Terminal 3
cd /path/to/your/project

# Deploy Claude Code
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"
```

### 4. Create a Task

```bash
dev task create --type "feature" --name "Build authentication"
dev task assign --task task_XXX --agent claude-code-001
```

### 5. Watch PICARD

See your agent:
- Appear in Agent Fleet (🟢 ACTIVE)
- Claim the task (🎯)
- Generate events (📊)
- Complete the task (✅)

---

## Understanding PICARD

### What You See in the Dashboard

**Top Left: Agent Fleet**
- All deployed agents across platforms
- Status (🟢 ACTIVE, 🟡 IDLE, 🔵 BUSY, 🔴 ERROR)
- Role (⚡ Specialist, 🤖 Assistant, etc.)
- Task counts

**Bottom Left: Task Queue**
- Pending and active tasks
- Priority levels (🔥 CRITICAL, HIGH, MED, low)
- Assigned agents

**Top Right: ROI Metrics**
- Tasks completed (24h)
- Lines of code delivered
- Cost in dollars
- **Lines per Dollar** ⚡ (your key metric)

**Middle Right: Context Management**
- Token usage per agent
- Context window utilization
- Color-coded (🟢 < 60%, 🟡 60-70%, 🔴 > 70%)

**Lower Right: Quality Gates**
- Success rate (target: > 80%)
- Error rate (target: < 15%)
- Overall status (✓ PASSING or ✗ FAILING)

**Bottom: Live Event Stream**
- Real-time agent activity
- Color-coded events (🟢 start, 🔴 stop, ✅ complete, ❌ fail)

---

## Core Concepts

### Constitutional Agents

Agents with defined:
- **Constitution**: Principles, values, constraints
- **Specialization**: Frontend, Backend, Testing, etc.
- **Skills**: read, write, edit, bash, etc.
- **Budgets**: Cost and context limits
- **Quality Gates**: Automated checks

### ROI Tracking

Every task tracked for:
- Cost (dollars)
- Tokens (input + output)
- Output (lines of code, files modified)
- Time to completion

**Key Metric**: Lines per Dollar
- > 200 = Good
- > 500 = Excellent

### Quality Gates

Automated checks:
- No TypeScript errors
- Linter passing
- Tests green
- Coverage > threshold
- Build succeeds

**Enforced**: Tasks fail if gates don't pass.

### Context Management

Monitor token usage:
- < 60%: ✅ Healthy
- 60-70%: ⚠️ Warning
- > 70%: 🚨 Optimize!

**Why**: Bloated context = slow + expensive + poor quality

---

## Creating Specialized Agents

### Why Specialize?

Instead of one general agent:
- Lower context per agent = faster + cheaper
- Focused expertise = higher quality
- Parallel work = ship faster

### Create an Agent

```bash
# Run wizard
~/.dev/scripts/agent-create

# Enter:
# - Agent ID: frontend-specialist-001
# - Name: Frontend Specialist
# - Type: specialist
# - Parent: none
# - Purpose: React/TypeScript component development
```

This creates:
- Constitution file
- System prompt
- Registry entry template

### Deploy the Agent

```bash
dev deploy --agent frontend-specialist-001 --platform claude-code --project ~/my-project
```

---

## Deploying Teams

### Create a Team

```bash
# Create team
dev team create --name "Dev Team" --strategy leader-follower

# Add agents
dev team add-agent --team team-dev-team --agent frontend-001 --role lead
dev team add-agent --team team-dev-team --agent backend-001 --role specialist
dev team add-agent --team team-dev-team --agent testing-001 --role specialist
```

### Deploy from Manifest

```bash
# Copy template
cp orchestration/manifests/example-team.yaml my-team.yaml

# Edit for your project
nano my-team.yaml

# Deploy
dev team deploy --manifest my-team.yaml
```

---

## Commands Reference

### Main CLI

```bash
dev                      # Interactive menu
dev help                 # All commands
```

### PICARD Dashboard

```bash
picard                   # Launch TUI
# or
dev picard
```

### Deployment

```bash
dev deploy --agent <id> --platform <name> --project <path>
dev team deploy --manifest <file>
```

### Task Management

```bash
dev task create --type <type> --name <name> [--priority high]
dev task assign --task <id> --agent <id>
dev task list [--status pending|active]
dev task status <id>
```

### Team Orchestration

```bash
dev team create --name <name> --strategy <strategy>
dev team add-agent --team <id> --agent <id> --role <role>
dev team list
dev team status <id>
```

---

## Examples

See `examples/` directory for:
- Single agent deployment
- Multi-agent team deployment
- Platform bridge examples
- Custom quality gates
- ROI optimization strategies

---

## Troubleshooting

### Command Not Found

```bash
# Add to PATH
export PATH="$HOME/.dev/scripts:$PATH"

# Or reload shell
source ~/.zshrc
```

### Database Not Initialized

```bash
sqlite3 ~/.dev/logs/observability.db < ~/.dev/observability/schema.sql
```

### Python Dependencies Missing

```bash
pip3 install --user rich textual
```

### Event Collector Won't Start

```bash
# Check Python version
python3 --version  # Should be 3.9+

# Check port availability
lsof -i :8765      # Should be free
```

---

## Next Steps

1. **Read**: [Architecture](ARCHITECTURE.md) - Understand the system
2. **Deploy**: [Quick Start](QUICKSTART.md) - Deploy your first team
3. **Optimize**: [ROI Guide](ROI_OPTIMIZATION.md) - Maximize efficiency
4. **Contribute**: [Contributing](../CONTRIBUTING.md) - Help improve PICARD

---

## Support

- **Documentation**: `docs/`
- **Issues**: [GitHub Issues](https://github.com/bradheitmann/picard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bradheitmann/picard/discussions)

---

**🖖 Make it so!**
