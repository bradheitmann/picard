# PICARD Protocol Standards Integration

## Standards PICARD Supports

### 1. **MCP** (Model Context Protocol) - Agent↔Tool
**Source**: Anthropic (Nov 2024)
**Adopted by**: OpenAI (Mar 2025), Google DeepMind (Apr 2025)
**Purpose**: Standardize how agents access tools and data sources
**PICARD Use**: Agent tools, data access, resource management

### 2. **ACP** (Agent Client Protocol) - Editor↔Agent
**Source**: Zed Industries (Aug 2025)
**Adopted by**: Zed, Neovim, Marimo, JetBrains (Oct 2025)
**Purpose**: JSON-RPC over stdio for editor-agent communication
**PICARD Use**: Desktop IDE integration (Claude Code, Cursor, Zed)

### 3. **Agent-to-Agent Protocol** (Apr 2025)
**Purpose**: Direct agent communication
**PICARD Use**: Multi-agent workflows (PM↔Dev↔QA)

### 4. **LangGraph Patterns**
**Source**: LangChain
**Purpose**: State machine workflows for agents
**PICARD Use**: Workflow orchestration (PM-Dev-QA loops)

### 5. **OpenTelemetry**
**Purpose**: Observability and tracing
**PICARD Use**: Event tracking, metrics, traces

---

## PICARD Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PICARD CORE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Message    │  │   Workflow   │  │   Context    │  │
│  │    Broker    │  │    Engine    │  │    Store     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                ↓           ↓           ↓
┌─────────────────────────────────────────────────────────┐
│               PROTOCOL ADAPTERS                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ MCP  │  │ ACP  │  │Agent │  │OTel  │  │Custom│     │
│  │Server│  │Server│  │  2   │  │Trace │  │Proto │     │
│  └──────┘  └──────┘  │Agent │  └──────┘  └──────┘     │
│                      └──────┘                           │
└─────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────┐
│                    PLATFORMS                            │
│  Claude Code | Cursor | Zed | Codex | Trae | etc.     │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation

### MCP Server (Tools & Resources)
```typescript
// PICARD exposes tools via MCP
// Agents can call PICARD tools

{
  "tools": [
    {
      "name": "assign_task",
      "description": "Assign task to another agent",
      "inputSchema": {/*...*/}
    },
    {
      "name": "get_context",
      "description": "Get shared context from RAD protocol",
      "inputSchema": {/*...*/}
    }
  ]
}
```

### ACP Server (Editor Integration)
```typescript
// JSON-RPC over stdio
// Editor sends: agent.execute_task
// Agent sends: agent.task_progress

{
  "jsonrpc": "2.0",
  "method": "agent.execute_task",
  "params": {
    "task_id": "123",
    "description": "Build auth"
  }
}
```

### Agent-to-Agent Messages
```typescript
// PM → Dev
{
  "from": "pm-agent",
  "to": "dev-agent",
  "type": "task_assignment",
  "payload": {
    "task": "Build login",
    "spec": "See docs/specs/auth.md",
    "priority": "high"
  }
}

// Dev → QA (after completion)
{
  "from": "dev-agent",
  "to": "qa-agent",
  "type": "ready_for_test",
  "payload": {
    "task": "Build login",
    "files": ["src/auth/Login.tsx"],
    "tests": ["tests/auth.test.ts"]
  }
}

// QA → Dev (if issues found)
{
  "from": "qa-agent",
  "to": "dev-agent",
  "type": "test_failure",
  "payload": {
    "task": "Build login",
    "failures": ["Password validation missing"],
    "severity": "high"
  }
}
```

---

## PM-Dev-QA Workflow (Automated)

```typescript
// workflow/pm-dev-qa.ts

const workflow = {
  name: "PM-Dev-QA Loop",
  agents: {
    pm: { role: "product_manager", agent_id: "pm-001" },
    dev: { role: "developer", agent_id: "dev-001" },
    qa: { role: "qa_engineer", agent_id: "qa-001" }
  },

  flow: [
    {
      step: "spec_creation",
      agent: "pm",
      output: "task_spec",
      next: "development"
    },
    {
      step: "development",
      agent: "dev",
      input: "task_spec",
      output: "implementation",
      next: "testing"
    },
    {
      step: "testing",
      agent: "qa",
      input: "implementation",
      output: "test_results",
      next_if_pass: "done",
      next_if_fail: "rework"
    },
    {
      step: "rework",
      agent: "dev",
      input: "test_results",
      output: "fixes",
      next: "testing"  // Loop back
    }
  ]
};
```

This is what PICARD needs to build!
