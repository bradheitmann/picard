# Start PM-Dev-QA Autonomous Workflow

Launch an autonomous multi-agent workflow where PM, Dev, and QA agents coordinate automatically.

## What This Does

Creates a workflow where:
1. **PM agent** creates specification
2. **Dev agent** implements feature automatically
3. **QA agent** tests implementation automatically
4. If tests pass → Complete
5. If tests fail → Dev fixes (adversarial loop)
6. **No human intervention needed!**

## Steps

1. Ask the user:
   - Project name
   - Task/Feature name
   - Brief specification
   - Which agents to use (or suggest pm-001, dev-001, qa-001)

2. Create the task in PICARD database:
   ```bash
   sqlite3 ~/.dev/logs/observability.db <<EOF
   INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, priority)
   VALUES ('[task-id]', 'pm-001', '[session-id]', '[name]', 'spec_created', 'high');
   EOF
   ```

3. Send message from PM to Dev:
   ```bash
   ~/.dev/picard-bash/scripts/core/message-send "pm-001" "dev-001" "command" "implement:[spec]"
   ```

4. Explain what will happen:
   - PM → Dev: "Implement this feature"
   - Dev implements and signals QA
   - QA tests and either approves or rejects
   - If rejected, Dev fixes and resubmits
   - Loop continues until QA approves

5. Show how to monitor:
   ```bash
   picard  # Show dashboard
   ```

6. Explain that agents will coordinate autonomously via the message broker.

Be enthusiastic! This is the cool autonomous part.
