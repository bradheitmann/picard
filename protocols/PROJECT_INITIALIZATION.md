# Project Initialization Protocol

**Version**: 1.0.0
**Category**: Project Management
**Status**: Active

---

## Overview

Standard protocol for initializing new projects with PICARD tracking, agent coordination, and best practices.

## Purpose

- Consistent project structure across all work
- PICARD-ready from day one
- Agent coordination built-in
- Quality gates configured
- Documentation framework in place

---

## Initialization Checklist

### Phase 1: Repository Setup

```bash
# Create project directory
mkdir -p ~/projects/my-project
cd ~/projects/my-project

# Initialize git
git init
git branch -M main

# Create .gitignore
curl -o .gitignore https://www.toptal.com/developers/gitignore/api/[language]
# Or create manually
```

### Phase 2: Core Files

Create these files:

#### 1. `/README.md`
```markdown
# Project Name

Brief description

## Quick Start
## Features
## Installation
## Usage
```

#### 2. `/AGENTS.md`
```markdown
# AGENTS.md

**Project**: [Name]

## Development Environment
## Commands
## Code Conventions
## Architecture
```

Use template: `protocols/AGENTS_MD_STANDARD.md`

#### 3. `.gitignore`
```
# Dependencies
node_modules/
venv/

# Build
dist/
build/

# Environment
.env
.env.local

# Logs
*.log

# OS
.DS_Store
```

### Phase 3: PICARD Integration

#### Register Project

```bash
picard projects add ~/projects/my-project
```

Or manually:
```sql
sqlite3 ~/.dev/logs/observability.db <<EOF
INSERT INTO projects (project_id, project_name, project_path, project_type)
VALUES ('my-project', 'My Project', '~/projects/my-project', 'Web App');
EOF
```

#### Deploy Initial Agent

```bash
cd ~/projects/my-project
dev deploy --agent claude-code-001 --platform claude-code --project "$(pwd)"
```

### Phase 4: Quality Gates

Create quality gate configuration:

```yaml
# .picard/quality-gates.yaml

gates:
  - name: "syntax_check"
    command: "npm run typecheck"
    level: "blocking"

  - name: "tests_pass"
    command: "npm test"
    level: "blocking"

  - name: "lint_clean"
    command: "npm run lint"
    level: "blocking"
```

---

## Directory Structure Template

### Minimal Structure

```
my-project/
├── README.md
├── AGENTS.md
├── .gitignore
├── package.json
├── src/
│   └── index.ts
└── tests/
    └── index.test.ts
```

### Recommended Structure

```
my-project/
├── README.md
├── AGENTS.md
├── .gitignore
├── .env.example
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── config/
│   ├── lib/
│   └── types/
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── architecture.md
│   └── api.md
└── scripts/
    └── dev-tools.sh
```

### Advanced Structure (with PICARD)

```
my-project/
├── README.md
├── AGENTS.md
├── .gitignore
├── .env.example
├── package.json
├── tsconfig.json
├── .picard/
│   ├── quality-gates.yaml
│   ├── loadouts.yaml
│   └── team-manifest.yaml
├── src/
├── tests/
├── docs/
│   ├── specs/           # Feature specs
│   ├── protocols/       # Development protocols
│   └── architecture/    # System design
└── scripts/
```

---

## Language-Specific Templates

### TypeScript/Node.js

```bash
# Initialize
npm init -y
# or
pnpm init

# Add TypeScript
pnpm add -D typescript @types/node
npx tsc --init

# Add testing
pnpm add -D vitest

# Add linting
pnpm add -D @biomejs/biome
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Python

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt <<EOF
# Add your dependencies
EOF

# Install
pip install -r requirements.txt

# Add dev dependencies
pip install pytest ruff mypy black
```

**pyproject.toml**:
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 100

[tool.mypy]
strict = true
```

---

## First Commit

```bash
git add .
git commit -m "Initial commit: Project structure initialized

- Added README.md and AGENTS.md
- Configured quality gates
- Set up PICARD tracking

🖖 Generated with PICARD
"
```

---

## PICARD Project Registration

After initialization:

```bash
# View in PICARD
picard

# Should see your project in the Projects panel

# Deploy agents
dev deploy --agent [agent-id] --platform [platform] --project "$(pwd)"

# Create first task
dev task create --type "setup" --name "Configure CI/CD"
```

---

## Best Practices

### 1. Start with AGENTS.md

AI agents check this first. Make it comprehensive.

### 2. Configure Quality Gates Early

Don't wait until you have bad code.

### 3. Use .env.example

Never commit secrets. Provide examples.

### 4. Document Early

Write docs as you code, not after.

### 5. Track in PICARD

Register project immediately for metrics.

---

## Common Patterns

### Web App (React/Vue/Svelte)
1. Package manager: pnpm or bun
2. Build tool: Vite
3. Testing: Vitest + Playwright
4. Linting: Biome or ESLint
5. Hosting: Vercel, Netlify, Cloudflare Pages

### API/Backend
1. Runtime: Node.js, Python, Go
2. Framework: Express, FastAPI, Gin
3. Database: PostgreSQL, MongoDB
4. Testing: Unit + integration tests
5. Hosting: Fly.io, Railway, AWS

### CLI Tool
1. Language: Go, Rust, TypeScript (Bun)
2. Arg parsing: cobra, clap, yargs
3. Testing: Unit tests
4. Distribution: Homebrew, npm, cargo

---

## Automation

### PICARD Auto-Init

```bash
# PICARD can auto-initialize projects
picard init my-project ~/projects/my-project --type webapp --lang typescript

# Creates:
# - Directory structure
# - AGENTS.md
# - package.json
# - Quality gates
# - Git repository
# - PICARD registration
```

---

## Version History

### v1.0.0 - 2025-11-14
- Initial protocol
- Templates for common project types
- PICARD integration
- Quality gate configuration

---

**Start every project right. Make it so!** 🖖
