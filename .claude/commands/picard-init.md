# Initialize New Project with PICARD

Guide the user through creating a new project with full PICARD tracking.

## Steps

1. Ask the user for:
   - Project name
   - Project path (suggest ~/projects/[name])
   - Project type (Web App, CLI Tool, Library, API, etc.)
   - Technology stack (TypeScript, Python, Go, etc.)
   - Package manager (npm, pnpm, bun, pip, etc.)

2. Create the project structure:
   ```bash
   mkdir -p [path]/{src,tests,docs,scripts}
   cd [path]
   ```

3. Create AGENTS.md at project root:
   - Industry standard format
   - Include development commands
   - Add project-specific conventions
   - Add architecture overview

4. Create docs/PROJECT_STATE.md:
   - Current phase
   - Project goals
   - Active tasks
   - Blockers
   - Metrics

5. Initialize appropriate project files:
   - package.json (if Node/Bun)
   - pyproject.toml (if Python)
   - go.mod (if Go)
   - .gitignore
   - README.md

6. Register in PICARD database:
   ```bash
   sqlite3 ~/.dev/logs/observability.db <<EOF
   INSERT INTO projects (project_id, project_name, project_path, project_type, status, phase)
   VALUES ('[id]', '[name]', '[path]', '[type]', 'active', 'initialization');
   EOF
   ```

7. Show next steps:
   - How to deploy agents
   - How to create tasks
   - How to start workflows

Be friendly, explain each step, show progress.
