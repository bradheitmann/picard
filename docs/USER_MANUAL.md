# 🖖 PICARD User Manual

**Project Intelligence, Coordination, And Resource Deployment**

*Complete guide to using the PICARD dashboard and commands*

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding the Dashboard](#understanding-the-dashboard)
3. [Commands Reference](#commands-reference)
4. [Deploying Agents](#deploying-agents)
5. [Managing Tasks](#managing-tasks)
6. [Reading Metrics](#reading-metrics)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Launch PICARD

From any directory:
```bash
picard
```

That's it! PICARD auto-starts the event collector if needed.

### Exit PICARD

Press **`Ctrl+C`**

PICARD will say: "✓ PICARD standing down. Make it so."

---

## Understanding the Dashboard

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│                    🖖 PICARD HEADER 🖖                   │
│                     (Title + Timestamp)                  │
├─────────────────────────────┬────────────────────────────┤
│ 🤖 AGENT FLEET              │ 💰 ROI METRICS (24H)       │
│ ───────────────────         │ ────────────────────       │
│ Agent     | Platform | Stat │ Tasks: 12                  │
│ frontend  | claude   | 🟢   │ Lines: 2,847               │
│ backend   | cursor   | 🟢   │ Cost: $3.45                │
│                             │ Lines/$: 825               │
├─────────────────────────────┼────────────────────────────┤
│ 📋 TASK QUEUE               │ 🧠 CONTEXT MANAGEMENT      │
│ ───────────────────         │ ────────────────────       │
│ Task          | Priority    │ Agent    | Usage %         │
│ Build UI      | 🔥 CRIT     │ frontend | 45% 🟢         │
│ Create API    | HIGH        │ backend  | 38% 🟢         │
│                             ├────────────────────────────┤
│                             │ 🎯 QUALITY GATES           │
│                             │ Success: 91.7% ✓ PASSING   │
│                             │ Error: 4.2%                │
│                             ├────────────────────────────┤
│                             │ 📊 LIVE EVENT STREAM       │
│                             │ 12:34:56 🎯 task.claimed   │
└─────────────────────────────┴────────────────────────────┘
│ Last Update: 2025-11-14 12:34:56  |  Press Ctrl+C to exit│
└──────────────────────────────────────────────────────────┘
```

### Reading the Panels

#### 🤖 **Agent Fleet** (Top Left)

Shows all active agents across all platforms.

**Columns**:
- **Agent**: Agent name or ID
- **Role**: Type of agent (🤖 Assistant, ⚡ Specialist, 🎯 Coordinator, 👀 Reviewer)
- **Platform**: Where it's running (claude, cursor, warp, etc.)
- **Status**: Current state with emoji
- **Active**: Number of active tasks right now
- **Done**: Total completed tasks
- **Fail**: Total failed tasks

**Status Indicators**:
- 🟢 **ACTIVE** - Agent deployed and working
- 🟡 **IDLE** - Agent ready but no tasks
- 🔵 **BUSY** - Currently executing a task
- 🔴 **ERROR** - Agent malfunctioning
- ⚪ **OFFLINE** - Agent not responding

#### 💰 **ROI Metrics** (Top Right)

Your efficiency dashboard.

**Metrics Explained**:
- **✅ Tasks Completed**: Tasks finished in last 24 hours
- **📝 Lines Delivered**: Total lines of code written
- **📁 Files Modified**: Number of files changed
- **🎫 Tokens Used**: Total tokens consumed
- **💰 Cost (24h)**: Money spent on AI calls
- **💵 Cost/Task**: Average cost per completed task
- **📈 Lines/$**: **KEY METRIC** - Lines of code per dollar spent

**Targets**:
- Lines/$ > 200 = Good
- Lines/$ > 500 = Excellent
- Cost/Task < $0.50 = Good

#### 📋 **Task Queue** (Bottom Left)

Shows pending and active work.

**Columns**:
- **Task**: Task name/description
- **Agent**: Who it's assigned to (or "—" if unassigned)
- **Status**: Current state with emoji
- **Priority**: Urgency level

**Status Emojis**:
- ⏳ **pending** - Not yet assigned
- 🎯 **assigned** - Assigned to agent
- ⚡ **in_progress** - Agent working on it
- ✅ **completed** - Task done
- ❌ **failed** - Task failed

**Priority Levels**:
- 🔥 **CRIT** (critical) - Red, urgent
- **HIGH** - Red, important
- **MED** (medium) - Yellow, normal
- **low** - Gray, when possible

#### 🧠 **Context Management** (Middle Right)

Token usage optimization.

**Columns**:
- **Agent**: Agent name
- **Avg**: Average input tokens per request
- **Max**: Maximum tokens used in a request
- **Window**: Total context window size
- **Usage %**: Percentage of window used

**Color Coding**:
- 🟢 **< 60%** - Healthy, efficient
- 🟡 **60-70%** - Warning, getting high
- 🔴 **> 70%** - Critical, optimize now!

**Why It Matters**: High context usage = slow + expensive + lower quality

#### 🎯 **Quality Gates** (Lower Right)

Automated quality enforcement.

**Metrics**:
- **✅ Success Rate**: % of tasks passing quality checks
- **❌ Error Rate**: % of tasks failing
- **Quality Gates**: Overall status

**Targets**:
- Success > 80% = ✓ PASSING (green)
- Error < 15% = ✓ PASSING (green)
- Otherwise = ✗ FAILING (red)

#### 📊 **Live Event Stream** (Bottom Right)

Real-time activity feed.

**Shows last 6 events** with:
- **Time**: HH:MM:SS
- **Emoji**: Event type indicator
- **Agent**: Which agent (first 12 chars)
- **Event Type**: What happened

**Event Emojis**:
- 🟢 `agent.started` - Agent deployed
- 🔴 `agent.stopped` - Agent shut down
- 🚀 `agent.deployed` - Agent activated
- 🎯 `task.claimed` - Task picked up
- ✅ `task.completed` - Task finished
- ❌ `task.failed` - Task failed
- 📝 `action.file_write` - File created/edited
- ⚙️ `action.bash_command` - Command executed
- ⚠️ `conflict.detected` - Agent conflict

---

## Commands Reference

### While PICARD is Running

PICARD itself is **view-only**. Commands run in other terminals.

### Main CLI Commands

#### Help & Navigation

```bash
dev                          # Interactive menu
dev help                     # Show all commands
dev status                   # Alternative text dashboard
psa-global                   # PSA global view
```

#### Deploy Agents

```bash
# Deploy single agent
dev deploy --agent <agent-id> --platform <platform> --project <path>

# Example:
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"

# Deploy team from manifest
dev team deploy --manifest $HOME/.dev/orchestration/manifests/my-team.yaml
```

#### Manage Tasks

```bash
# Create task
dev task create --type <type> --name <name> [--priority high|medium|low|critical]

# Example:
dev task create --type "frontend" --name "Build user dashboard" --priority critical

# Assign to agent
dev task assign --task <task-id> --agent <agent-id>

# List tasks
dev task list
dev task list --status pending
dev task list --status active

# Check task status
dev task status <task-id>
```

#### Manage Teams

```bash
# Create team
dev team create --name "Team Name" --strategy leader-follower

# Add agent to team
dev team add-agent --team <team-id> --agent <agent-id> --role <role>

# Roles: lead, specialist, qa, reviewer

# List teams
dev team list

# Team status
dev team status <team-id>
```

#### Agent Management

```bash
# Create new constitutional agent
$HOME/.dev/scripts/agent-create

# View agents
dev agents

# Log agent activity
dev agent log <agent-id> "Message about what was done"
```

#### Events & Insights

```bash
# Emit custom event
dev event emit <event-type> --agent <id> --metadata '{...}'

# Harvest insights from projects
dev harvest
```

---

## Deploying Agents

### Step-by-Step Guide

#### 1. Navigate to Your Project

```bash
cd /path/to/your/project
```

#### 2. Deploy an Agent

```bash
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"
```

**What happens**:
- Agent constitution copied to `.claude/agents/`
- Agent activation script created
- Agent registered in database
- Event emitted: `agent.deployed`
- Agent appears in PICARD dashboard as 🟢 ACTIVE

#### 3. Create Tasks

```bash
dev task create --type "feature" --name "Build authentication" --priority high
```

**Output**:
```
✓ Task created: task_1731601234_a1b2c3
  Type: feature
  Name: Build authentication

Assign with: dev task assign --task task_1731601234_a1b2c3 --agent <agent-id>
```

#### 4. Assign Tasks

```bash
# List tasks to get ID
dev task list

# Assign
dev task assign --task task_1731601234_a1b2c3 --agent claude-code-001
```

**What you see in PICARD**:
- Task appears in 📋 TASK QUEUE
- Shows as 🎯 assigned
- When agent starts: changes to ⚡ in_progress
- When done: shows ✅ completed

---

## Reading Metrics

### ROI Metrics Explained

#### **Lines per Dollar** 📈 (Most Important)

How much code you get per dollar spent.

**Formula**: Total lines delivered ÷ Total cost

**What it means**:
- 825 lines/$ = For every $1 spent, you got 825 lines of code
- Higher = better efficiency

**Benchmarks**:
- > 200 = Good value
- > 500 = Excellent value
- > 1000 = Outstanding (highly optimized agents)

**How to improve**:
- Use specialized agents (lower context needs)
- Batch similar tasks
- Optimize prompts

#### **Cost per Task** 💵

Average money spent per completed task.

**Formula**: Total cost ÷ Tasks completed

**Benchmarks**:
- < $0.50 = Good
- < $0.25 = Excellent
- < $0.10 = Outstanding

**How to improve**:
- Use cheaper models for simple tasks
- Specialize agents (less context)
- Enable prompt caching

#### **Token Usage** 🎫

Total tokens consumed across all agents.

**Monitor because**:
- Tokens = money
- More tokens = higher cost
- Track to optimize spending

### Context Management

#### Reading the Panel

Shows how much of each agent's context window is being used.

**Example**:
```
Agent          | Avg    | Max    | Window  | Usage %
frontend-001   | 45,000 | 65,000 | 100,000 | 45% 🟢
backend-001    | 72,000 | 85,000 | 100,000 | 72% 🔴
```

**What it means**:
- frontend-001: Healthy (45% usage)
- backend-001: **ALERT!** (72% - too high)

**Actions to take**:
- 🟢 < 60%: Good, no action needed
- 🟡 60-70%: Warning, consider optimizing
- 🔴 > 70%: **Optimize now!**
  - Break task into smaller pieces
  - Use more specialized agent
  - Reduce files in context

### Quality Gates

#### Understanding Pass/Fail

**Passing Criteria**:
- Success Rate > 80%
- Error Rate < 15%

**Example**:
```
✅ Success Rate: 91.7%     ← Above 80%, good!
❌ Error Rate: 4.2%        ← Below 15%, good!
Quality Gates: ✓ PASSING  ← Overall: PASSING
```

**If FAILING**:
```
✅ Success Rate: 65.0%     ← Below 80%, bad!
❌ Error Rate: 22.0%       ← Above 15%, bad!
Quality Gates: ✗ FAILING  ← Fix before continuing
```

**What to do when FAILING**:
1. Stop deploying more agents
2. Review recent failures in event stream
3. Check agent prompts/constitutions
4. Break tasks smaller
5. Add more specific instructions

---

## Typical Workflows

### Workflow 1: Solo Development with PICARD

```bash
# Terminal 1: Launch PICARD
picard

# Terminal 2: Work
cd $HOME/my-project
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"

# Just work normally in your IDE
# PICARD tracks everything automatically
```

### Workflow 2: Multi-Agent Team

```bash
# Terminal 1: PICARD
picard

# Terminal 2: Deploy team
cd $HOME/my-project
dev deploy --agent frontend-001 --platform claude-code --project "$(pwd)"
dev deploy --agent backend-001 --platform cursor --project "$(pwd)"
dev deploy --agent testing-001 --platform cursor --project "$(pwd)"

# Create tasks
dev task create --type "frontend" --name "User dashboard" --priority high
dev task create --type "backend" --name "Auth API" --priority high
dev task create --type "testing" --name "E2E tests" --priority medium

# Assign tasks
dev task assign --task task_XXX --agent frontend-001
dev task assign --task task_YYY --agent backend-001
dev task assign --task task_ZZZ --agent testing-001

# Watch coordination in PICARD!
```

### Workflow 3: Cloud Agent Integration

```bash
# Terminal 1: PICARD
picard

# Terminal 2: Work in cloud IDE (Claude Web, Cursor Cloud, etc.)
# Then manually log completion:
dev event emit task.completed --agent claude-web-001 --metadata '{"outcome":"success"}'

# Or use webhook (advanced - see CLOUD_AGENTS.md)
```

---

## Command Examples

### Deploy Agent Examples

```bash
# Claude Code
dev deploy --agent claude-code-001 --platform claude-code --project $HOME/my-app

# Cursor
dev deploy --agent cursor-specialist --platform cursor --project $HOME/my-app

# Multiple agents with team
dev team create --name "Dev Team" --strategy leader-follower
dev team add-agent --team team-dev-team --agent claude-code-001 --role lead
dev team add-agent --team team-dev-team --agent cursor-001 --role specialist
```

### Task Examples

```bash
# Simple task
dev task create --type "feature" --name "Add login page"

# Urgent task
dev task create --type "bugfix" --name "Fix payment crash" --priority critical

# Check what's in queue
dev task list

# Assign task
dev task assign --task task_1234567_abc --agent frontend-specialist
```

### Event Examples

```bash
# Manual task completion (for cloud agents)
dev event emit task.completed \
  --agent claude-web-001 \
  --task task_123 \
  --metadata '{"outcome":"success","files_modified":3,"lines_added":145}'

# Agent started
dev event emit agent.started \
  --agent my-custom-agent \
  --session sess_abc123 \
  --metadata '{"platform":"custom","version":"1.0"}'
```

---

## Reading Event Stream

### Event Types You'll See

**Lifecycle Events**:
- 🟢 `agent.started` - Agent coming online
- 🔴 `agent.stopped` - Agent shutting down
- 🚀 `agent.deployed` - Agent activated on platform

**Task Events**:
- 🎯 `task.claimed` - Agent picked up a task
- ⚡ `task.progress` - Task in progress
- ✅ `task.completed` - Task finished successfully
- ❌ `task.failed` - Task failed

**Action Events**:
- 📝 `action.file_write` - File created or edited
- 📖 `action.file_read` - File read
- ⚙️ `action.bash_command` - Shell command executed

**Coordination Events**:
- 💬 `agent.message` - Agent-to-agent communication
- ⚠️ `conflict.detected` - Multiple agents on same file

**Metric Events**:
- 📊 `metric.performance` - Performance metric recorded
- 🎫 `token.usage` - Token consumption logged

### What to Watch For

**Good Signs** 🟢:
- Steady stream of `task.completed` ✅
- Low `task.failed` count
- Quality gates PASSING
- Context usage < 60%

**Warning Signs** 🟡:
- Context usage approaching 70%
- Cost climbing rapidly
- Quality gates approaching failure threshold

**Problem Signs** 🔴:
- Multiple `task.failed` ❌ in a row
- `conflict.detected` ⚠️ frequently
- Agent shows 🔴 ERROR status
- Quality gates ✗ FAILING

---

## Troubleshooting

### PICARD Won't Start

**Error**: `Command not found: picard`

**Fix**:
```bash
source $HOME/.zshrc
# Or
export PATH="$HOME/.dev/scripts:$PATH"
```

---

**Error**: `Database not initialized`

**Fix**:
```bash
sqlite3 $HOME/.dev/logs/observability.db < $HOME/.dev/observability/schema.sql
```

---

**Error**: `ModuleNotFoundError: No module named 'rich'`

**Fix**:
```bash
pip3 install --user --break-system-packages rich textual
```

---

### Dashboard Shows No Agents

**Reason**: No agents deployed yet

**Fix**:
```bash
cd /path/to/project
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"
```

---

### No Events Showing

**Reason**: Event collector not running

**Fix**: PICARD auto-starts it, but if issues:
```bash
# Kill any stuck collectors
pkill -f event-collector

# Restart PICARD
picard
```

---

### Database Errors

**Error**: `no such table: X` or `no such column: Y`

**Fix**: Re-initialize database
```bash
# Backup first
cp $HOME/.dev/logs/observability.db $HOME/.dev/logs/observability.db.backup

# Re-initialize
sqlite3 $HOME/.dev/logs/observability.db < $HOME/.dev/observability/schema.sql
```

---

## Advanced Usage

### Query Database Directly

```bash
# Agent performance
sqlite3 $HOME/.dev/logs/observability.db "SELECT * FROM v_agent_performance"

# Recent errors
sqlite3 $HOME/.dev/logs/observability.db "SELECT * FROM v_recent_errors LIMIT 10"

# Tool usage
sqlite3 $HOME/.dev/logs/observability.db "SELECT * FROM v_tool_usage_summary"

# All events today
sqlite3 $HOME/.dev/logs/observability.db \
  "SELECT * FROM events WHERE DATE(timestamp) = DATE('now') ORDER BY id DESC"
```

### View Event Stream (Text)

```bash
# Tail live events
tail -f $HOME/.dev/logs/events/global-stream.jsonl

# View last 10 events (formatted)
tail -10 $HOME/.dev/logs/events/global-stream.jsonl | jq '.'

# Search for specific agent
grep "claude-code-001" $HOME/.dev/logs/events/global-stream.jsonl | tail -5
```

### Export Metrics

```bash
# Export to CSV
sqlite3 -header -csv $HOME/.dev/logs/observability.db \
  "SELECT * FROM v_agent_performance" > agent-metrics.csv

# Export events
sqlite3 -header -csv $HOME/.dev/logs/observability.db \
  "SELECT * FROM events WHERE DATE(timestamp) = DATE('now')" > events-today.csv
```

---

## Keyboard Shortcuts

### In PICARD

- **Ctrl+C** - Exit PICARD

### In Terminal (with PICARD visible elsewhere)

Standard terminal shortcuts work:
- **Ctrl+L** - Clear terminal
- **Ctrl+R** - Search command history
- **↑/↓** - Navigate command history

---

## Best Practices

### Keep PICARD Visible

Run PICARD in a dedicated terminal window or screen that's always visible. It's your command center.

### Watch Quality Gates

If gates go ✗ FAILING:
1. Stop deploying more work
2. Fix the quality issues
3. Resume when ✓ PASSING

### Monitor Context Usage

If any agent shows 🔴 > 70%:
- Task is too broad
- Break into smaller pieces
- Or use more specialized agent

### Track ROI

Watch **Lines per Dollar** metric:
- Declining = need to optimize
- Increasing = agents getting more efficient

### Use Priorities

Not everything is critical:
- 🔥 CRITICAL - Blockers, prod issues
- HIGH - Important features
- MEDIUM - Normal development
- low - Nice-to-haves, polish

---

## Quick Reference Card

### Essential Commands

```
picard              Launch dashboard
Ctrl+C              Exit dashboard

dev deploy          Deploy agent
dev task create     Create task
dev task assign     Assign task
dev status          Text dashboard
dev help            All commands
```

### Key Metrics to Watch

```
Lines/$             > 200 good, > 500 excellent
Cost/Task           < $0.50 good
Success Rate        > 80%
Error Rate          < 15%
Context Usage       < 60% good, < 70% acceptable
```

### Status Indicators

```
🟢 ACTIVE           Agent working
🟡 IDLE             Agent ready
🔵 BUSY             Agent on task
🔴 ERROR            Agent issue

✓ PASSING           Quality good
✗ FAILING           Fix quality issues
```

---

## Getting Help

### In-System Help

```bash
dev help                     # All commands
cat $HOME/.dev/PICARD_USER_MANUAL.md    # This file
cat $HOME/.dev/CHEAT_SHEET.md            # Quick reference
cat $HOME/.dev/START_HERE.md             # Complete guide
```

### Documentation

- **User Manual**: `$HOME/.dev/PICARD_USER_MANUAL.md` (this file)
- **System Overview**: `$HOME/.dev/SYSTEM_OVERVIEW.md`
- **Architecture**: `$HOME/.dev/orchestration/ARCHITECTURE.md`
- **Cloud Agents**: `$HOME/.dev/orchestration/CLOUD_AGENTS.md`

### Community

- **GitHub**: https://github.com/bradheitmann/picard
- **Issues**: https://github.com/bradheitmann/picard/issues
- **Discussions**: https://github.com/bradheitmann/picard/discussions

---

## Appendix: Complete Command List

```bash
# === PICARD ===
picard                                      # Launch dashboard
picard --version                            # Show version

# === MAIN CLI ===
dev                                         # Interactive menu
dev help                                    # All commands
dev status                                  # Global dashboard
dev list                                    # List projects
dev goto <number>                           # Jump to project

# === DEPLOYMENT ===
dev deploy --agent <id> --platform <p> --project <path>
dev team deploy --manifest <file>

# === TASKS ===
dev task create --type <t> --name <n> [--priority <p>]
dev task assign --task <id> --agent <id>
dev task list [--status <s>]
dev task status <id>

# === TEAMS ===
dev team create --name <n> --strategy <s>
dev team add-agent --team <t> --agent <a> --role <r>
dev team list
dev team status <id>

# === AGENTS ===
dev agents                                  # List agents
dev agent log <agent> "message"             # Log activity
$HOME/.dev/scripts/agent-create                 # Create agent

# === EVENTS ===
dev event emit <type> --agent <id> [--metadata '{}']

# === KNOWLEDGE ===
dev playbooks                               # List playbooks
dev protocols                               # List protocols
dev insights                                # View insights
dev harvest                                 # Extract insights

# === LEGACY ===
psa-global                                  # PSA dashboard
psa-list                                    # List projects
```

---

**🖖 PICARD User Manual v1.0.0**

*Press `h` in terminal for help overlay (coming in v1.1)*

**Make it so!**
