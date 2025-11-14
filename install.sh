#!/usr/bin/env bash

# PICARD Installation Script
# Installs PICARD multi-agent orchestration platform

set -euo pipefail

INSTALL_DIR="${HOME}/.dev"

# Colors
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_CYAN="\033[36m"
C_RED="\033[31m"
C_BOLD="\033[1m"
C_RESET="\033[0m"

echo -e "${C_BOLD}${C_CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               🖖 PICARD Installer 🖖                    ║"
echo "║   Project Intelligence, Coordination, And Resource       ║"
echo "║                    Deployment                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${C_RESET}"
echo ""

# Check prerequisites
echo -e "${C_CYAN}Checking prerequisites...${C_RESET}"

# Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${C_RED}✗ Python 3 not found${C_RESET}"
    echo "  Install Python 3.9+ first"
    exit 1
fi
echo -e "  ${C_GREEN}✓${C_RESET} Python 3"

# SQLite
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${C_RED}✗ SQLite3 not found${C_RESET}"
    echo "  Install: brew install sqlite (macOS) or apt install sqlite3 (Linux)"
    exit 1
fi
echo -e "  ${C_GREEN}✓${C_RESET} SQLite3"

# pip3
if ! command -v pip3 &> /dev/null; then
    echo -e "${C_YELLOW}⚠ pip3 not found, trying pip${C_RESET}"
    if ! command -v pip &> /dev/null; then
        echo -e "${C_RED}✗ pip not found${C_RESET}"
        exit 1
    fi
fi
echo -e "  ${C_GREEN}✓${C_RESET} pip"

echo ""

# Create directories
echo -e "${C_CYAN}Creating directories...${C_RESET}"

mkdir -p "${INSTALL_DIR}"/{scripts,agents,observability,orchestration,playbooks,protocols,insights,logs/events,config}

echo -e "  ${C_GREEN}✓${C_RESET} Created ${INSTALL_DIR}"

# Copy files
echo ""
echo -e "${C_CYAN}Installing PICARD...${C_RESET}"

cp -r scripts/* "${INSTALL_DIR}/scripts/" 2>/dev/null || true
cp -r observability/* "${INSTALL_DIR}/observability/" 2>/dev/null || true
cp -r orchestration/* "${INSTALL_DIR}/orchestration/" 2>/dev/null || true
cp -r agents/* "${INSTALL_DIR}/agents/" 2>/dev/null || true
cp -r playbooks/* "${INSTALL_DIR}/playbooks/" 2>/dev/null || true
cp -r config/config.yaml.example "${INSTALL_DIR}/config/"

echo -e "  ${C_GREEN}✓${C_RESET} Files copied"

# Make scripts executable
chmod +x "${INSTALL_DIR}"/scripts/* 2>/dev/null || true

echo -e "  ${C_GREEN}✓${C_RESET} Scripts made executable"

# Install Python dependencies
echo ""
echo -e "${C_CYAN}Installing Python dependencies...${C_RESET}"

pip3 install --user --quiet rich textual 2>&1 | grep -v "WARNING" || true

echo -e "  ${C_GREEN}✓${C_RESET} Installed rich and textual"

# Initialize database
echo ""
echo -e "${C_CYAN}Initializing database...${C_RESET}"

sqlite3 "${INSTALL_DIR}/logs/observability.db" < observability/schema.sql

echo -e "  ${C_GREEN}✓${C_RESET} Database initialized"

# Add to PATH
SHELL_RC=""
SHELL_NAME=$(basename "$SHELL")

case "$SHELL_NAME" in
  bash)
    SHELL_RC="${HOME}/.bashrc"
    [ -f "${HOME}/.bash_profile" ] && SHELL_RC="${HOME}/.bash_profile"
    ;;
  zsh)
    SHELL_RC="${HOME}/.zshrc"
    ;;
  *)
    SHELL_RC="${HOME}/.profile"
    ;;
esac

if ! grep -q "\.dev/scripts" "$SHELL_RC" 2>/dev/null; then
    echo ""
    echo -e "${C_CYAN}Adding PICARD to PATH...${C_RESET}"

    cat >> "$SHELL_RC" <<'EOF'

# ===== PICARD =====
# Multi-Agent Orchestration Platform
export PATH="$HOME/.dev/scripts:$PATH"
# ==================

EOF

    echo -e "  ${C_GREEN}✓${C_RESET} Added to $SHELL_RC"
fi

# Create initial config
if [ ! -f "${INSTALL_DIR}/config/config.yaml" ]; then
    cp "${INSTALL_DIR}/config/config.yaml.example" "${INSTALL_DIR}/config/config.yaml"
    echo -e "  ${C_GREEN}✓${C_RESET} Created config.yaml"
fi

echo ""
echo -e "${C_BOLD}${C_GREEN}✅ PICARD installed successfully!${C_RESET}"
echo ""
echo -e "${C_BOLD}Next steps:${C_RESET}"
echo "  1. Reload your shell: source $SHELL_RC"
echo "  2. Or restart your terminal"
echo ""
echo "  3. Start event collector: ~/.dev/observability/event-collector.py &"
echo "  4. Launch PICARD: picard"
echo ""
echo "  5. Read docs: cat ~/.dev/README.md"
echo "  6. Quick start: cat ~/.dev/docs/GETTING_STARTED.md"
echo ""
echo -e "${C_CYAN}Commands available:${C_RESET}"
echo "  picard        - TUI dashboard"
echo "  dev           - Main CLI"
echo "  dev help      - All commands"
echo ""
echo -e "${C_BOLD}${C_CYAN}🖖 Make it so!${C_RESET}"
