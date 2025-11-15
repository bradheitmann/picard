#!/usr/bin/env bash
# PICARD PM/Dev/QA Automation Hook
# Chains agents together automatically using MVC protocol

set -euo pipefail

MESSAGES_DIR="${HOME}/.dev/messages"
DB="${HOME}/.dev/logs/observability.db"

# Check if we're in a PICARD-tracked project
if [ ! -f "docs/PROJECT_STATE.md" ]; then
  exit 0  # Not a PICARD project, skip
fi

# Detect agent role from CLAUDE.md or environment
AGENT_ROLE="${PICARD_AGENT_ROLE:-dev}"  # Default to dev

# Get current task from context
CURRENT_TASK=$(grep -m1 "Current Task:" docs/PROJECT_STATE.md 2>/dev/null | cut -d: -f2- | xargs || echo "")

if [ -z "$CURRENT_TASK" ]; then
  exit 0  # No active task
fi

# PM/Dev/QA Chain Logic
case "$AGENT_ROLE" in
  pm)
    # PM just finished creating spec → Send to Dev
    echo "🔄 PICARD: PM completed spec, notifying Dev agent..."

    # Create message for Dev
    mkdir -p "$MESSAGES_DIR/dev-agent"
    cat > "$MESSAGES_DIR/dev-agent/msg_$(date +%s).json" <<EOF
{
  "from": "pm-agent",
  "to": "dev-agent",
  "type": "command",
  "action": "implement_feature",
  "task": "$CURRENT_TASK",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    echo "✓ Dev agent will be notified to implement"
    echo "  Next: Dev agent implements → QA agent tests"
    ;;

  dev)
    # Dev finished implementation → Send to QA
    echo "🔄 PICARD: Dev completed implementation, notifying QA agent..."

    # Create message for QA
    mkdir -p "$MESSAGES_DIR/qa-agent"
    cat > "$MESSAGES_DIR/qa-agent/msg_$(date +%s).json" <<EOF
{
  "from": "dev-agent",
  "to": "qa-agent",
  "type": "command",
  "action": "test_implementation",
  "task": "$CURRENT_TASK",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    echo "✓ QA agent will be notified to test"
    echo "  Next: QA agent tests implementation"
    ;;

  qa)
    # QA finished testing → Check if passed or failed
    # This would check test results and either:
    # - Send approval to PM
    # - Send rejection back to Dev (adversarial)

    echo "🔄 PICARD: QA completed testing..."

    # Simple check: look for test failures in recent output
    if grep -qi "fail\|error" ~/.claude/logs/latest.log 2>/dev/null; then
      # Tests failed → Send back to Dev (ADVERSARIAL)
      echo "❌ Tests FAILED - Sending back to Dev for fixes"

      mkdir -p "$MESSAGES_DIR/dev-agent"
      cat > "$MESSAGES_DIR/dev-agent/msg_$(date +%s).json" <<EOF
{
  "from": "qa-agent",
  "to": "dev-agent",
  "type": "command",
  "action": "fix_issues",
  "task": "$CURRENT_TASK",
  "issues": "Tests failing - see logs",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

      echo "  Next: Dev must fix issues and resubmit"
    else
      # Tests passed → Notify PM
      echo "✅ Tests PASSED - Notifying PM of completion"

      mkdir -p "$MESSAGES_DIR/pm-agent"
      cat > "$MESSAGES_DIR/pm-agent/msg_$(date +%s).json" <<EOF
{
  "from": "qa-agent",
  "to": "pm-agent",
  "type": "notification",
  "action": "task_approved",
  "task": "$CURRENT_TASK",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

      echo "  ✓ Task complete!"
    fi
    ;;
esac

# Log to PICARD event stream
echo "{\"type\":\"agent.completed\",\"agent\":\"$AGENT_ROLE-agent\",\"task\":\"$CURRENT_TASK\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> ~/.dev/logs/events/global-stream.jsonl
