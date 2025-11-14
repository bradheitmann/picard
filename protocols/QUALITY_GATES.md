# Quality Gates Protocol

**Version**: 1.0.0
**Category**: Quality Assurance
**Status**: Active

---

## Overview

Quality Gates are automated checks that run before accepting agent output. They prevent low-quality code from being merged and reduce rework costs.

## Purpose

- **Prevent bugs** from entering codebase
- **Enforce standards** automatically
- **Reduce rework** (fixing bad code costs more)
- **Maintain quality** across agent outputs

---

## Standard Quality Gates

### Code Quality Gates

#### 1. No Syntax Errors
```bash
# TypeScript/JavaScript
tsc --noEmit

# Python
python -m py_compile src/**/*.py

# Go
go build ./...
```

#### 2. Linter Passing
```bash
# JavaScript/TypeScript
biome check .
# or
eslint .

# Python
ruff check .

# Go
golangci-lint run
```

#### 3. Formatter Clean
```bash
# Biome
biome format --write .

# Prettier
prettier --check .

# Black (Python)
black --check .
```

#### 4. Type Checking
```bash
# TypeScript
tsc --noEmit

# Python
mypy src/

# Go (built-in)
go build
```

### Testing Gates

#### 5. All Tests Passing
```bash
# Vitest
vitest run

# Jest
npm test

# Pytest
pytest

# Go
go test ./...
```

#### 6. Minimum Test Coverage
```bash
# Vitest with coverage threshold
vitest run --coverage --coverage.lines=80

# Jest
jest --coverage --coverageThreshold='{"global":{"lines":80}}'

# Pytest with coverage
pytest --cov=src --cov-fail-under=80
```

### Build Gates

#### 7. Build Succeeds
```bash
# Vite
vite build

# Next.js
next build

# Go
go build -o dist/app
```

#### 8. No Console Logs (Production)
```bash
# Check for console.log
! grep -r "console\\.log" src/

# Or use eslint rule
# no-console: "error"
```

### Security Gates

#### 9. No Secrets in Code
```bash
# Check for common secret patterns
! grep -r "api_key\|password\|secret" src/ --include="*.ts"

# Use tools like:
# - trufflehog
# - gitleaks
# - detect-secrets
```

#### 10. Dependency Audit
```bash
# npm
npm audit --audit-level=moderate

# pnpm
pnpm audit

# Python
pip-audit
```

---

## Gate Enforcement Levels

### Level 1: Advisory (Warn)
- Run checks, log results
- Don't block if failing
- Useful for gradual adoption

### Level 2: Blocking (Fail)
- Run checks, block if failing
- Agent output rejected
- Must fix before proceeding

### Level 3: Auto-Fix
- Run checks
- Auto-fix if possible
- Block if can't auto-fix

---

## Implementing in PICARD

### Agent Manifest

```yaml
agents:
  - id: "frontend-specialist"
    quality_gates:
      # Level 2: Blocking
      - name: "no_typescript_errors"
        command: "tsc --noEmit"
        level: "blocking"

      - name: "biome_check"
        command: "biome check ."
        level: "blocking"

      - name: "tests_pass"
        command: "vitest run"
        level: "blocking"

      - name: "coverage_80_pct"
        command: "vitest run --coverage --coverage.lines=80"
        level: "blocking"

      # Level 1: Advisory
      - name: "no_console_logs"
        command: "! grep -r 'console.log' src/"
        level: "advisory"
```

### Custom Gates

Add project-specific checks:

```yaml
quality_gates:
  - name: "lighthouse_score_90"
    command: "lighthouse --score-threshold=90 http://localhost:5173"
    level: "advisory"

  - name: "bundle_size_under_500kb"
    command: "test $(du -sk dist/ | cut -f1) -lt 500"
    level: "blocking"

  - name: "no_hardcoded_urls"
    command: "! grep -r 'http://localhost' src/"
    level: "blocking"
```

---

## Best Practices

### Start Small

Don't add all gates at once:

**Phase 1**: Core gates
- Syntax errors
- Tests passing

**Phase 2**: Quality gates
- Linter
- Type checking

**Phase 3**: Advanced gates
- Coverage thresholds
- Performance checks
- Security scans

### Make Gates Fast

Slow gates = slow feedback:
- ✅ Syntax check: < 1s
- ✅ Linter: < 5s
- ✅ Tests: < 30s
- ⚠️ Full build: < 60s
- ❌ E2E tests: Run separately

### Set Realistic Thresholds

Don't aim for perfection immediately:

**Coverage**:
- Start: 50%
- Goal: 70%
- Excellent: 80%+

**Performance**:
- Lighthouse: Start 70, goal 90
- Bundle size: Depends on project

---

## Common Gates by Language

### JavaScript/TypeScript

```yaml
quality_gates:
  - tsc --noEmit
  - eslint . or biome check .
  - vitest run
  - vitest --coverage --coverage.lines=70
```

### Python

```yaml
quality_gates:
  - python -m py_compile src/**/*.py
  - ruff check .
  - mypy src/
  - pytest --cov=src --cov-fail-under=70
```

### Go

```yaml
quality_gates:
  - go build ./...
  - golangci-lint run
  - go test ./...
  - go test -cover ./... | grep "coverage: [7-9][0-9]%"
```

---

## Monitoring in PICARD

PICARD's Quality Gates panel shows:
- ✅ Success Rate (% passing gates)
- ❌ Error Rate (% failing gates)
- Overall: ✓ PASSING or ✗ FAILING

**Target**: Keep > 80% success, < 15% error

---

## Troubleshooting

### Gates Failing Frequently

**Problem**: > 20% failure rate

**Solutions**:
1. Gates too strict - relax thresholds
2. Agent needs better instructions - improve prompts
3. Tasks too complex - break into smaller pieces

### Gates Too Slow

**Problem**: Gates taking > 60s

**Solutions**:
1. Run only essential gates on every task
2. Run expensive gates (E2E, performance) periodically
3. Parallelize gate execution

### False Positives

**Problem**: Gates fail on valid code

**Solutions**:
1. Update gate logic
2. Add exceptions for specific cases
3. Change from blocking to advisory

---

## Version History

### v1.0.0 - 2025-11-14
- Initial quality gates protocol
- Standard gates for common languages
- Integration with PICARD
- Enforcement levels

---

**Quality gates = quality code. Make it so!** 🖖
