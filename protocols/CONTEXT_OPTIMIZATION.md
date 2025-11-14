# Context Optimization Protocol

**Version**: 1.0.0
**Category**: Performance
**Status**: Active

---

## Overview

Context optimization reduces the amount of code/text AI agents need to process, resulting in faster responses, lower costs, and higher quality output.

## The Problem

**Bloated context** leads to:
- 💰 Higher costs (more tokens = more $$$)
- 🐌 Slower responses (processing time)
- 📉 Lower quality (too much info = confused agent)
- 🧠 Memory issues (hitting context limits)

---

## Key Principles

### 1. Minimize Scope

**Bad**: Give agent entire codebase
```
Context: All 50 files in src/
Result: 150,000 tokens, slow, expensive
```

**Good**: Give only relevant files
```
Context: 3 files related to current task
Result: 5,000 tokens, fast, cheap
```

### 2. Specialize Agents

**Bad**: One general agent for everything
```
Agent knows: Frontend + Backend + DB + Testing + Deployment
Context: 200,000 tokens
Cost/task: $2.00
```

**Good**: Specialized agents
```
Frontend Agent knows: React + TypeScript + Tailwind
Context: 40,000 tokens
Cost/task: $0.30
```

### 3. Use References, Not Full Text

**Bad**: Include entire API response
```
Context: Full 50KB API documentation
```

**Good**: Reference with key points
```
Context: "API endpoint: POST /api/users, requires {email, password}"
```

---

## Optimization Techniques

### Technique 1: File Filtering

Only include files relevant to the task:

```bash
# For a React component task:
# Include:
- src/components/[Component].tsx
- src/types/[Component].types.ts
- tests/[Component].test.tsx

# Exclude:
- Backend files
- Database schemas
- Unrelated components
```

### Technique 2: Code Summarization

Replace full implementations with summaries:

**Full** (5,000 tokens):
```typescript
// Entire AuthService with 200 lines of implementation
```

**Summary** (500 tokens):
```typescript
// AuthService: Handles login, logout, token refresh
// Key methods: login(email, pass), logout(), refreshToken()
// Returns: User object or throws AuthError
```

### Technique 3: Documentation Extraction

Extract only relevant sections:

**Bad**: Entire README (10,000 tokens)

**Good**: Just "Getting Started" section (500 tokens)

### Technique 4: Hierarchical Context

Provide context in layers:

**Layer 1** (Always): Task description
**Layer 2** (If needed): Relevant files
**Layer 3** (If still needed): Related types/interfaces
**Layer 4** (Rarely): Full project structure

---

## Context Budget Management

### Set Budgets

```yaml
agents:
  - id: "frontend-specialist"
    context_budget:
      max_tokens: 100,000
      reserved_pct: 30        # Reserve 30% for system/coordination
      effective_budget: 70,000  # What agent can use for task
```

### Monitor in PICARD

Watch "🧠 Context Management" panel:

```
Agent          | Avg    | Max    | Window  | Usage %
frontend-001   | 45,000 | 65,000 | 100,000 | 45% 🟢  ← Healthy!
backend-001    | 85,000 | 95,000 | 100,000 | 85% 🔴  ← Too high!
```

**Actions**:
- < 60%: ✅ Optimal
- 60-70%: ⚠️ Monitor
- > 70%: 🚨 Optimize now!

---

## Optimization Strategies

### Strategy 1: Task Breakdown

Instead of:
```
Task: "Build entire authentication system"
Context needed: 50 files, 150,000 tokens
```

Break into:
```
Task 1: "Build login form UI" (3 files, 5,000 tokens)
Task 2: "Implement auth API" (2 files, 4,000 tokens)
Task 3: "Add token management" (2 files, 3,000 tokens)
Task 4: "Write auth tests" (3 files, 6,000 tokens)
```

### Strategy 2: Agent Specialization

```yaml
# General agent (BAD)
agent: "general-purpose"
knows_about: [frontend, backend, database, deployment, testing]
avg_context: 120,000 tokens

# Specialized agents (GOOD)
agents:
  - frontend-specialist:
      knows_about: [react, typescript, tailwind]
      avg_context: 35,000 tokens

  - backend-specialist:
      knows_about: [api, database, auth]
      avg_context: 30,000 tokens

  - testing-specialist:
      knows_about: [vitest, playwright]
      avg_context: 25,000 tokens
```

### Strategy 3: Progressive Disclosure

Start minimal, add context only if needed:

```
Round 1: Just task description (1,000 tokens)
↓ Agent asks for more
Round 2: Add relevant files (5,000 tokens)
↓ Agent still needs context
Round 3: Add types/interfaces (2,000 tokens)
↓ Agent can now complete task

Total: 8,000 tokens vs. giving everything upfront (50,000 tokens)
```

---

## Measuring Success

### Metrics to Track (in PICARD)

1. **Average Context per Task**
   - Target: < 50,000 tokens
   - Excellent: < 30,000 tokens

2. **Context Efficiency**
   - Formula: Lines delivered / Context tokens used
   - Target: > 0.5 lines per 100 tokens

3. **Cost per Task**
   - Directly related to context size
   - Lower context = lower cost

### Benchmarks

| Context Size | Speed | Cost | Quality |
|-------------|-------|------|---------|
| < 30K tokens | Fast | Low | High |
| 30-60K tokens | Medium | Medium | Medium |
| 60-100K tokens | Slow | High | Medium |
| > 100K tokens | Very Slow | Very High | Declining |

---

## Common Pitfalls

### Pitfall 1: Including Everything

**Symptom**: Context usage always > 70%

**Cause**: Loading entire codebase for every task

**Fix**: Filter files by relevance

### Pitfall 2: Over-Specialized Agents

**Symptom**: Agent can't complete simple tasks

**Cause**: Too narrow scope, missing necessary context

**Fix**: Broaden slightly or provide references

### Pitfall 3: Duplicate Context

**Symptom**: Same code in context multiple times

**Cause**: Including files that import each other

**Fix**: Reference once, avoid circular includes

---

## Tools & Techniques

### Context Analysis

```bash
# Count tokens in a file (rough estimate)
wc -w file.ts | awk '{print $1 * 1.3}'  # Words * 1.3 ≈ tokens

# Check agent's current context (if supported)
# Platform-specific - check your IDE/agent docs
```

### Automated Filtering

Create `.picard/context-filter.yaml`:

```yaml
# Files to always exclude from context
exclude:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
  - "*.test.ts"  # Exclude unless working on tests
  - "*.spec.ts"

# Files to always include
include:
  - "AGENTS.md"
  - "package.json"
  - "tsconfig.json"

# Conditional includes based on task type
task_types:
  frontend:
    include: ["src/components/**", "src/hooks/**"]
    exclude: ["src/api/**", "src/database/**"]

  backend:
    include: ["src/api/**", "src/database/**"]
    exclude: ["src/components/**"]
```

---

## Integration with PICARD

### Context Monitoring

PICARD's "🧠 Context Management" panel shows:
- Real-time token usage per agent
- Percentage of context window used
- Alerts when > 70%

### Automatic Optimization

Future PICARD features:
- Auto-suggest task breakdown when context high
- Recommend more specialized agent
- Filter files based on task type

---

## ROI Impact

### Example Optimization

**Before**:
```
Task: "Add user profile page"
Context: 80,000 tokens
Cost: $0.80/task
Time: 45 seconds
Quality: 7/10
```

**After** (optimized):
```
Task: Same
Context: 25,000 tokens (filtered)
Cost: $0.25/task
Time: 15 seconds
Quality: 9/10
```

**Savings**: 70% cost reduction, 3x faster, higher quality!

---

## Best Practices

### ✅ Do

- Filter files to task-relevant only
- Use specialized agents
- Break large tasks into smaller pieces
- Monitor context usage in PICARD
- Set context budgets per agent
- Use summaries instead of full code

### ❌ Don't

- Include entire codebase for every task
- Use general-purpose agents for specialized work
- Ignore context usage warnings
- Let context creep above 70%
- Include test files unless working on tests
- Include documentation unless needed

---

## Monitoring & Alerts

### PICARD Alerts

Set up alerts for context issues:

```yaml
alerts:
  - type: "context_overload"
    condition: "context_usage > 70%"
    action: "notify + suggest_optimization"

  - type: "context_trend_up"
    condition: "avg_context increasing > 20% over 1 hour"
    action: "notify"
```

---

## Version History

### v1.0.0 - 2025-11-14
- Initial context optimization protocol
- Best practices and techniques
- PICARD integration
- Measurement and monitoring

---

**Less context = more efficiency. Make it so!** 🖖
