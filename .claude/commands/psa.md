# Display Project Status

Read docs/PROJECT_STATE.md and current context, format as beautiful markdown with ASCII box characters.

**Format Protocol v2.0 - TASKS FIRST!**

## Output Format

```markdown
# ╔═══════════════════════════════════════════════════════╗
# ║  [PROJECT NAME] - PROJECT STATUS                     ║
# ╚═══════════════════════════════════════════════════════╝

**📅 Date:** [current timestamp]
**🏗️ Phase:** [current phase]
**⏱️ Timeline:** [timeline info]

---

## ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
## ┃  📋 TASK LIST                        ┃
## ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

### 🔵 IN PROGRESS (X)

├─ TASK-XXX │ Task Name │ Agent │ ████████░░ XX%
└─ TASK-XXX │ Task Name │ Agent │ ████████░░ XX%

### ⚪ PENDING - [PHASE NAME]

├─ TASK-XXX │ Task Name │ UNASSIGNED │ Xh │ 🔴 Priority
└─ TASK-XXX │ Task Name │ UNASSIGNED │ Xh │ 🟡 Priority

### ✅ COMPLETED (X)

└─ TASK-XXX │ Task Name │ Agent │ ✅ Done

---

## ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
## ┃  📊 SUMMARY                          ┃
## ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

**Task Status:**
- ⚪ Pending: X (XX%)
- 🔵 In Progress: X (XX%)
- ✅ Completed: X (XX%)

**Overall Progress:** X/X tasks [████░░░░░░] XX%

**Key Metrics:**
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| [Metric] | [Value] | [Target] | [Status] |

---

## ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
## ┃  👥 TEAM STATUS                      ┃
## ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

### 🟢 ACTIVE (X)

| Agent | Model | IDE | Current Work |
|-------|-------|-----|--------------|
| **Name** | model | ide | work |

### ⚪ AVAILABLE (X)

├─ SlotName │ Available
└─ SlotName │ Available

---

## ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
## ┃  🚨 BLOCKERS & NEXT ACTIONS          ┃
## ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

### 🔴 CRITICAL
1. [Blocker description]

### 🟡 HIGH
2. [Action needed]

---

**🚀 [Project Code] │ Protocol v2.0 │ X agents active**
```

## Key Requirements

1. **TASKS FIRST** - Most important info at top
2. **Beautiful ASCII boxes** - Use box drawing characters
3. **Tree structure** - Use ├─ └─ for lists
4. **Progress bars** - Use █ and ░
5. **Color emojis** - 🔵 🟢 🟡 🔴 ⚪ ✅
6. **Collapsible sections** - Use `<details>` for long lists
7. **Tables** - For metrics and team status
8. **Clear hierarchy** - Tasks → Summary → Team → Blockers

Read PROJECT_STATE.md, extract all info, format beautifully.

Be precise with ASCII characters. Make it visually stunning.
