# Create New Task

Interactively create a new task in PICARD.

## Steps

1. Ask the user:
   - Task name (what needs to be done)
   - Task type (feature, bug, docs, test, refactor)
   - Priority (low, medium, high, critical)
   - Assign to agent? (or leave unassigned)

2. Create task in PICARD database:
   ```bash
   TASK_ID="task_$(date +%s)_$(openssl rand -hex 4)"

   sqlite3 ~/.dev/logs/observability.db <<EOF
   INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, priority, claimed_at)
   VALUES ('$TASK_ID', '[agent-or-unassigned]', 'sess_$(date +%s)', '[name]', 'pending', '[priority]', CURRENT_TIMESTAMP);
   EOF
   ```

3. Show confirmation:
   - Task created successfully
   - Task ID
   - Priority level
   - Assigned agent (or "unassigned")

4. Show next steps:
   - View all tasks: `picard task list`
   - Assign later: `picard task assign [task-id] [agent-id]`
   - See in dashboard: `picard`

Be encouraging! Creating tasks is the start of getting things done.
