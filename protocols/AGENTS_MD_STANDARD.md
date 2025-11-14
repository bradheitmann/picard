# AGENTS.md Standard Protocol

**Version**: 1.0.0
**Category**: Documentation
**Status**: Active

---

## Overview

The AGENTS.md standard is an industry-emerging protocol for providing guidance to AI coding agents (like GPT-5 Codex, Claude Code, GitHub Copilot, Zed AI, etc.) working in your codebase.

## Purpose

When an AI agent encounters your repository, it should read `/AGENTS.md` at the root to understand:
- How to build and run the project
- Testing procedures
- Code conventions and patterns
- Project-specific constraints
- Architecture overview

## File Location

**Must be at repository root**: `/AGENTS.md`

Why root level?
- Discoverable by AI tools
- Standardized location across projects
- First file AI agents check

---

## Template Structure

### Minimal AGENTS.md

```markdown
# AGENTS.md

**Project**: [Project Name]
**Last Updated**: [Date]

## Development Environment

- Runtime: [Node.js 20, Python 3.11, etc.]
- Package Manager: [npm, pnpm, bun, pip, etc.]
- Language: [TypeScript, Python, Go, etc.]

## Commands

**Install dependencies:**
```bash
[command]
```

**Run development:**
```bash
[command]
```

**Run tests:**
```bash
[command]
```

**Build:**
```bash
[command]
```

## Code Conventions

- [Convention 1]
- [Convention 2]
- [Convention 3]

## Architecture

[Brief description of project structure]

## Important Notes

- [Critical constraint 1]
- [Critical constraint 2]
```

---

## Recommended Sections

### Essential

1. **Development Environment** - Runtime, versions, tools
2. **Commands** - Build, test, run
3. **Code Conventions** - Style, patterns, standards
4. **Architecture** - High-level structure

### Recommended

5. **File Structure** - Directory organization
6. **Testing Strategy** - How to test
7. **Dependencies** - What libraries/frameworks used
8. **Common Pitfalls** - Things to avoid

### Advanced

9. **AI Agent Loadouts** - Recommended configurations for this project
10. **Quality Gates** - Automated checks
11. **Performance Considerations** - Optimization tips
12. **Security Notes** - Authentication, secrets handling

---

## Example: TypeScript/React Project

```markdown
# AGENTS.md

**Project**: My Awesome App
**Last Updated**: 2025-11-14

## Development Environment

- Runtime: Node.js 20+
- Package Manager: pnpm (preferred) or npm
- Language: TypeScript 5.4
- Framework: React 18 + Vite

## Commands

**Install dependencies:**
```bash
pnpm install
```

**Run development:**
```bash
pnpm dev
```

**Run tests:**
```bash
pnpm test
```

**Build:**
```bash
pnpm build
```

**Type check:**
```bash
pnpm typecheck
```

## Code Conventions

- Use TypeScript strict mode
- Functional components with hooks
- CSS-in-JS with Tailwind CSS
- 2 spaces indentation
- PascalCase for components, camelCase for functions

## Architecture

```
src/
├── components/  # React components
├── hooks/       # Custom hooks
├── lib/         # Utilities
├── pages/       # Page components
└── types/       # TypeScript types
```

## Testing Strategy

- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Aim for >80% coverage

## Important Notes

- Use `import.meta.env` for environment variables (Vite)
- All async operations must handle errors
- Components must be SSR-safe (no `window` in top-level code)
- Follow React hooks rules of hooks
```

---

## AI Agent Loadout Recommendations

You can include recommended agent configurations:

```markdown
## Recommended AI Agent Loadouts

### For Component Development
- **Model**: Claude Sonnet 4
- **IDE**: Claude Code or Cursor
- **Temperature**: 0.7
- **Focus**: React components, TypeScript types

### For Testing
- **Model**: GPT-4
- **IDE**: CLI or Cursor
- **Temperature**: 0.3 (deterministic)
- **Focus**: Test coverage, edge cases

### For Documentation
- **Model**: Claude Sonnet 3.5
- **IDE**: Any
- **Temperature**: 0.5
- **Focus**: Clear explanations, examples
```

---

## Integration with PICARD

PICARD reads AGENTS.md to:
- Understand project context
- Configure quality gates
- Set appropriate loadouts
- Guide agent behavior

When initializing a project with PICARD:
```bash
picard init my-project ~/projects/my-project
```

PICARD creates AGENTS.md from this template.

---

## Version History

### v1.0.0 - 2025-11-14
- Initial standard
- Based on industry best practices
- Compatible with GPT-5 Codex, Claude Code, GitHub Copilot, Zed AI

---

## References

- OpenAI AGENTS.md discussions (2024-2025)
- Anthropic Claude Code documentation
- GitHub Copilot best practices
- Community feedback from AI coding tools

---

**This is a living standard - contribute improvements!**
