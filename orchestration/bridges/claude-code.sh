#!/usr/bin/env bash

# Claude Code Platform Bridge
# Deploys and manages agents in Claude Code environment

set -euo pipefail

BRIDGE_NAME="claude-code"
ACTION="${1:-}"
shift || true

# Colors
C_GREEN="\033[32m"
C_RED="\033[31m"
C_RESET="\033[0m"

# Bridge functions

deploy_agent() {
    local agent_id="$1"
    local project_path="$2"
    local agent_config="${HOME}/.dev/agents/constitutions/${agent_id}.md"

    if [ ! -f "$agent_config" ]; then
        echo -e "${C_RED}✗ Agent constitution not found: $agent_config${C_RESET}"
        return 1
    fi

    # Create .claude directory if needed
    local claude_dir="${project_path}/.claude"
    mkdir -p "${claude_dir}/agents"
    mkdir -p "${claude_dir}/commands"
    mkdir -p "${claude_dir}/hooks"

    # Copy agent constitution
    cp "$agent_config" "${claude_dir}/agents/${agent_id}.md"

    # Copy prompts if they exist
    local prompts_dir="${HOME}/.dev/agents/prompts/${agent_id}"
    if [ -d "$prompts_dir" ]; then
        mkdir -p "${claude_dir}/agents/${agent_id}"
        cp -r "${prompts_dir}"/* "${claude_dir}/agents/${agent_id}/"
    fi

    # Create activation script
    cat > "${claude_dir}/agents/${agent_id}-activate.sh" <<EOF
#!/usr/bin/env bash
# Auto-generated agent activation script
export AGENT_ID="${agent_id}"
export SESSION_ID="sess_\$(date +%s)"
export PROJECT_PATH="${project_path}"

# Emit agent.started event
~/.dev/scripts/event-emit agent.started \\
  --agent "${agent_id}" \\
  --session "\${SESSION_ID}" \\
  --project "$(basename "$project_path")" \\
  --metadata '{"version":"1.0.0","platform":"claude-code"}'

echo "Agent ${agent_id} activated"
EOF

    chmod +x "${claude_dir}/agents/${agent_id}-activate.sh"

    echo -e "${C_GREEN}✓ Agent ${agent_id} deployed to ${project_path}${C_RESET}"
    echo "  Constitution: ${claude_dir}/agents/${agent_id}.md"
    echo "  Activation: ${claude_dir}/agents/${agent_id}-activate.sh"
}

get_status() {
    local agent_id="$1"
    local project_path="$2"
    local claude_dir="${project_path}/.claude"

    if [ -f "${claude_dir}/agents/${agent_id}.md" ]; then
        echo "deployed"
    else
        echo "not_deployed"
    fi
}

submit_task() {
    local task_id="$1"
    local agent_id="$2"
    local project_path="$3"
    local task_data="$4"

    local claude_dir="${project_path}/.claude"
    mkdir -p "${claude_dir}/tasks"

    # Write task file
    cat > "${claude_dir}/tasks/${task_id}.yaml" <<EOF
task_id: ${task_id}
agent_id: ${agent_id}
timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
data: |
$(echo "$task_data" | sed 's/^/  /')
EOF

    echo -e "${C_GREEN}✓ Task ${task_id} submitted to ${agent_id}${C_RESET}"
}

health_check() {
    local agent_id="$1"
    local project_path="$2"

    # Check if agent files exist
    local claude_dir="${project_path}/.claude"
    if [ -f "${claude_dir}/agents/${agent_id}.md" ]; then
        echo "healthy"
        return 0
    else
        echo "not_found"
        return 1
    fi
}

terminate_agent() {
    local agent_id="$1"
    local project_path="$2"
    local claude_dir="${project_path}/.claude"

    if [ -d "${claude_dir}/agents" ]; then
        rm -f "${claude_dir}/agents/${agent_id}.md"
        rm -f "${claude_dir}/agents/${agent_id}-activate.sh"
        rm -rf "${claude_dir}/agents/${agent_id}"
    fi

    echo -e "${C_GREEN}✓ Agent ${agent_id} terminated${C_RESET}"
}

# Main dispatch
case "$ACTION" in
    deploy)
        deploy_agent "$@"
        ;;
    status)
        get_status "$@"
        ;;
    submit_task)
        submit_task "$@"
        ;;
    health)
        health_check "$@"
        ;;
    terminate)
        terminate_agent "$@"
        ;;
    *)
        echo "Usage: $0 {deploy|status|submit_task|health|terminate} [args...]"
        exit 1
        ;;
esac
