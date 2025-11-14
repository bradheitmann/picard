#!/usr/bin/env bash

# PICARD Dependency Checker
# Verifies all prerequisites before installation

set -e

# Colors
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_CYAN="\033[36m"
C_BOLD="\033[1m"
C_RESET="\033[0m"

echo -e "${C_BOLD}${C_CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        🖖 PICARD Dependency Checker 🖖                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${C_RESET}"
echo ""

ALL_OK=true

# Check Python
echo -e "${C_CYAN}Checking Python...${C_RESET}"
if command -v python3 &> /dev/null; then
    VERSION=$(python3 --version | awk '{print $2}')
    MAJOR=$(echo $VERSION | cut -d. -f1)
    MINOR=$(echo $VERSION | cut -d. -f2)

    if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 9 ]; then
        echo -e "  ${C_GREEN}✓${C_RESET} Python $VERSION (>= 3.9 required)"
    else
        echo -e "  ${C_RED}✗${C_RESET} Python $VERSION (need >= 3.9)"
        echo -e "    Install: brew install python (macOS) or apt install python3 (Linux)"
        ALL_OK=false
    fi
else
    echo -e "  ${C_RED}✗${C_RESET} Python not found"
    echo -e "    Install: brew install python (macOS) or apt install python3 (Linux)"
    ALL_OK=false
fi

# Check pip
echo ""
echo -e "${C_CYAN}Checking pip...${C_RESET}"
if command -v pip3 &> /dev/null; then
    echo -e "  ${C_GREEN}✓${C_RESET} pip3 available"
elif command -v pip &> /dev/null; then
    echo -e "  ${C_GREEN}✓${C_RESET} pip available"
else
    echo -e "  ${C_RED}✗${C_RESET} pip not found"
    echo -e "    Install: python3 -m ensurepip"
    ALL_OK=false
fi

# Check SQLite
echo ""
echo -e "${C_CYAN}Checking SQLite...${C_RESET}"
if command -v sqlite3 &> /dev/null; then
    VERSION=$(sqlite3 --version | awk '{print $1}')
    echo -e "  ${C_GREEN}✓${C_RESET} SQLite $VERSION"
else
    echo -e "  ${C_RED}✗${C_RESET} SQLite not found"
    echo -e "    Install: brew install sqlite (macOS) or apt install sqlite3 (Linux)"
    ALL_OK=false
fi

# Check Python libraries
echo ""
echo -e "${C_CYAN}Checking Python libraries...${C_RESET}"

if python3 -c "import rich" 2>/dev/null; then
    VERSION=$(python3 -c "import rich; print(rich.__version__)" 2>/dev/null || echo "unknown")
    echo -e "  ${C_GREEN}✓${C_RESET} rich $VERSION"
else
    echo -e "  ${C_YELLOW}⚠${C_RESET} rich not installed (will be installed)"
fi

if python3 -c "import textual" 2>/dev/null; then
    VERSION=$(python3 -c "import textual; print(textual.__version__)" 2>/dev/null || echo "unknown")
    echo -e "  ${C_GREEN}✓${C_RESET} textual $VERSION"
else
    echo -e "  ${C_YELLOW}⚠${C_RESET} textual not installed (will be installed)"
fi

# Check optional but recommended tools
echo ""
echo -e "${C_CYAN}Checking optional tools...${C_RESET}"

if command -v jq &> /dev/null; then
    echo -e "  ${C_GREEN}✓${C_RESET} jq (recommended for JSON processing)"
else
    echo -e "  ${C_YELLOW}○${C_RESET} jq not found (optional but recommended)"
    echo -e "    Install: brew install jq"
fi

if command -v fzf &> /dev/null; then
    echo -e "  ${C_GREEN}✓${C_RESET} fzf (recommended for fuzzy finding)"
else
    echo -e "  ${C_YELLOW}○${C_RESET} fzf not found (optional but recommended)"
    echo -e "    Install: brew install fzf"
fi

if command -v glow &> /dev/null; then
    echo -e "  ${C_GREEN}✓${C_RESET} glow (recommended for markdown viewing)"
else
    echo -e "  ${C_YELLOW}○${C_RESET} glow not found (optional but recommended)"
    echo -e "    Install: brew install glow"
fi

# Summary
echo ""
echo -e "${C_BOLD}═══════════════════════════════════════════════════════════${C_RESET}"
echo ""

if [ "$ALL_OK" = true ]; then
    echo -e "${C_BOLD}${C_GREEN}✅ All required dependencies satisfied!${C_RESET}"
    echo ""
    echo -e "${C_CYAN}You're ready to install PICARD:${C_RESET}"
    echo "  ./install.sh"
else
    echo -e "${C_BOLD}${C_RED}❌ Missing required dependencies${C_RESET}"
    echo ""
    echo -e "${C_CYAN}Install missing dependencies above, then run:${C_RESET}"
    echo "  ./check-dependencies.sh"
fi

echo ""
echo -e "${C_BOLD}${C_CYAN}🖖 Make it so!${C_RESET}"
