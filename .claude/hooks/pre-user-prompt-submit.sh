#!/usr/bin/env bash
# PICARD Message Checker Hook
# Checks for messages from other agents before each interaction

set -euo pipefail

MESSAGES_DIR="${HOME}/.dev/messages"
AGENT_ROLE="${PICARD_AGENT_ROLE:-dev}"
AGENT_ID="${AGENT_ROLE}-agent"

# Check for pending messages
if [ -d "$MESSAGES_DIR/$AGENT_ID" ]; then
  MESSAGE_COUNT=$(find "$MESSAGES_DIR/$AGENT_ID" -name "*.json" 2>/dev/null | wc -l | xargs)

  if [ "$MESSAGE_COUNT" -gt 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📬 You have $MESSAGE_COUNT message(s) from other agents!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Show messages
    for msg_file in "$MESSAGES_DIR/$AGENT_ID"/*.json; do
      if [ -f "$msg_file" ]; then
        FROM=$(jq -r '.from' "$msg_file" 2>/dev/null || echo "unknown")
        ACTION=$(jq -r '.action' "$msg_file" 2>/dev/null || echo "unknown")
        TASK=$(jq -r '.task' "$msg_file" 2>/dev/null || echo "unknown")

        echo "  From: $FROM"
        echo "  Action: $ACTION"
        echo "  Task: $TASK"
        echo ""

        # Mark as read (move to archive)
        mkdir -p "$MESSAGES_DIR/$AGENT_ID/.read"
        mv "$msg_file" "$MESSAGES_DIR/$AGENT_ID/.read/"
      fi
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  fi
fi
