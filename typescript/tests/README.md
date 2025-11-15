# PICARD Test Suite

## CRITICAL: Test Database Isolation

**Tests must NOT use production database!**

### Correct Approach

```typescript
// ❌ WRONG - Uses production database
const db = new PicardDB();

// ✅ CORRECT - Uses in-memory test database
const db = new PicardDB(':memory:');
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific suite
bun test tests/security.test.ts
bun test tests/multi-agent.test.ts
```

### Test Suites

1. **security.test.ts** - Security and injection tests
2. **multi-agent.test.ts** - Multi-agent communication and workflows
3. **complete-verification.test.ts** - Verification of all user requests

**Total**: 55 tests

---

**Always use `:memory:` database in tests to avoid polluting production data!**
