# Constitutional Agent Template

**Agent ID**: `[unique-id]`
**Name**: [Agent Name]
**Version**: 1.0.0
**Created**: [YYYY-MM-DD]
**Last Updated**: [YYYY-MM-DD]
**Status**: [active|inactive|deprecated]

---

## Constitution

### Core Principles

1. **[Principle 1]**: Description of fundamental principle
2. **[Principle 2]**: Description of fundamental principle
3. **[Principle 3]**: Description of fundamental principle

### Values

- **[Value 1]**: What this agent values and prioritizes
- **[Value 2]**: Secondary priorities
- **[Value 3]**: Tertiary considerations

### Constraints

- **MUST**: Things this agent absolutely must do
- **MUST NOT**: Things this agent absolutely must not do
- **SHOULD**: Best practices the agent should follow
- **MAY**: Optional behaviors

---

## Capabilities

### Skills

List of skills this agent possesses:

- `read` - Read files and directories
- `write` - Create new files
- `edit` - Modify existing files
- `bash` - Execute bash commands
- `[custom-skill]` - Description

### Tools

Available tools:

- Tool 1
- Tool 2
- Tool 3

### Subagents

Subagents this agent can delegate to:

- **[Subagent Name]**: Description and use case
- **[Subagent Name]**: Description and use case

---

## Workflows

### Primary Workflows

1. **[Workflow Name]**: Description
   - Step 1
   - Step 2
   - Step 3

2. **[Workflow Name]**: Description
   - Step 1
   - Step 2

### Custom Commands

List of slash commands or custom commands:

- `/command-name` - Description
- `/another-command` - Description

---

## Prompts

### System Prompt

```
[Main system prompt for this agent]
```

**Version**: 1.0.0
**File**: `prompts/[agent-id]/system-v1.md`

### Specialized Prompts

- **[Prompt Type]**: `prompts/[agent-id]/[type]-v1.md`
- **[Prompt Type]**: `prompts/[agent-id]/[type]-v1.md`

---

## Integration

### With Other Agents

How this agent coordinates with others:

- **Claude Code**: [Relationship description]
- **Trae**: [Relationship description]
- **Human**: [Relationship description]

### With Tools

- **VSCode**: [Integration notes]
- **Terminal**: [Integration notes]
- **Warp**: [Integration notes]

---

## Protocols

### Before Starting Work

1. Check project state
2. Review active agents
3. Claim task
4. ...

### During Work

1. Log activity
2. Update state
3. ...

### After Completing Work

1. Update PROJECT_STATE.md
2. Log to AGENT_ACTIVITY.jsonl
3. Harvest insights
4. ...

---

## Metrics

### Success Criteria

- [Metric 1]: Target value
- [Metric 2]: Target value
- [Metric 3]: Target value

### Performance Tracking

- **Tasks Completed**: [Count]
- **Average Task Time**: [Duration]
- **Conflict Rate**: [Percentage]
- **Knowledge Contributions**: [Count]

---

## Version History

### v1.0.0 - [YYYY-MM-DD]
- Initial constitution
- Defined core principles
- Established workflows

---

## References

- Parent Constitution: [If applicable]
- Related Agents: [Links]
- Playbooks: [Links to relevant playbooks]
- Protocols: [Links to protocols]
