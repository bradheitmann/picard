# PICARD Security Hardening Checklist

## Failed Tests - What Needs Fixing

### 1. ❌ Command Injection Test FAILED
**Issue**: Sanitization doesn't remove "/" character
**Current**: `"test; rm -rf /".replace(/[;&|`$()]/g, "")` → `"test rm -rf /"`
**Expected**: Should remove "/" as well
**Fix**:
```typescript
// src/security/validation.ts
export function sanitizeShellArg(arg: string): string {
  // Remove ALL dangerous characters including /
  return arg.replace(/[;&|`$()<>\/\\]/g, '');
}
```

### 2. ❌ Event Payload Size Limit FAILED
**Issue**: No size validation - accepts 10MB payloads (DOS vulnerability)
**Fix**: Add size check in event emission
```typescript
// src/db.ts or event collector
export function validateEventSize(metadata: unknown): void {
  const json = JSON.stringify(metadata);
  if (json.length > 1_000_000) { // 1MB max
    throw new Error('Event payload too large');
  }
}
```

### 3. ❌ SQL Injection Test (False Failure)
**Issue**: UNIQUE constraint - test task_id collision
**Not a security issue**: SQL injection is actually prevented (parameterized queries)
**Fix**: Use unique IDs in tests or clean up between tests

---

## Critical Missing Security Features

### 4. ⚠️ No Authentication on Event Collector (CRITICAL)
**Issue**: Anyone on localhost can POST events
**Risk**: Event poisoning, fake metrics
**Fix**: Add API key authentication
```python
# event-collector.py
PICARD_API_KEY = os.getenv('PICARD_API_KEY', secrets.token_hex(32))

# Save key on first run
with open(f'{HOME}/.dev/.picard_key', 'w') as f:
    f.write(PICARD_API_KEY)

# Verify on requests
def do_POST(self):
    api_key = self.headers.get('X-Picard-API-Key')
    if api_key != PICARD_API_KEY:
        self.send_response(403, 'Forbidden')
        return
```

### 5. ⚠️ No Authentication on Message Broker (CRITICAL)
**Issue**: Agents can impersonate each other
**Risk**: Malicious agent sends fake commands as another agent
**Fix**: Agent authentication tokens
```typescript
// When agent connects, issue token
const agentTokens = new Map<string, string>();

export function authenticateAgent(agentId: string, token: string): boolean {
  return agentTokens.get(agentId) === token;
}

// Require token on message send
async sendMessage(from: string, token: string, to: string, ...) {
  if (!authenticateAgent(from, token)) {
    throw new Error('Invalid agent token');
  }
}
```

### 6. ⚠️ No TLS/HTTPS (HIGH)
**Issue**: Event collector uses HTTP
**Risk**: Man-in-the-middle attacks if exposed beyond localhost
**Fix**: Add TLS support
```typescript
// For localhost-only use: Document "DO NOT EXPOSE"
// For network use: Require HTTPS with certificates
```

### 7. ⚠️ No Rate Limiting (MEDIUM)
**Issue**: Agent can spam unlimited events
**Risk**: Database bloat, DOS
**Fix**: Already created RateLimiter class, need to use it
```typescript
const rateLimiter = new RateLimiter(100); // 100 events/min

if (!rateLimiter.check(agentId)) {
  throw new Error('Rate limit exceeded');
}
```

---

## Additional Hardening Needed

### 8. Environment Variable Validation
**Missing**: Validate $HOME, $PICARD_HOME
**Fix**:
```typescript
const home = process.env.HOME;
if (!home || home.length === 0) {
  throw new Error('HOME environment variable not set');
}
```

### 9. Graceful Shutdown
**Missing**: No signal handling
**Fix**:
```typescript
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.close();
  broker.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  broker.close();
  process.exit(0);
});
```

### 10. Database Backup
**Missing**: No automatic backups
**Fix**:
```bash
# Daily backup cron
0 2 * * * cp ~/.dev/logs/observability.db ~/.dev/backups/observability-$(date +\%Y\%m\%d).db
```

### 11. Log Rotation
**Missing**: event streams grow forever
**Fix**:
```typescript
// Rotate logs when > 100MB
if (fileSize > 100_000_000) {
  fs.renameSync(logPath, `${logPath}.${Date.now()}`);
  // Keep last 10 rotated logs
}
```

### 12. Audit Logging
**Missing**: No audit trail of who did what
**Fix**:
```typescript
// Log all sensitive operations
auditLog('user_deployed_agent', { user: os.userInfo().username, agent: agentId });
auditLog('user_created_task', { user, task: taskId });
```

---

## Security Score

**Current**: 6/12 (50%)

**After P0 Fixes**: 9/12 (75%)
- ✅ Database permissions
- ✅ Input validation
- ✅ Shell injection prevention
- ✅ SQL injection prevention
- ✅ Path validation
- ✅ Size limits
- ⏳ Event collector auth
- ⏳ Message broker auth
- ⏳ Rate limiting

**After P1 Fixes**: 12/12 (100%) - Production hardened
- All P0 fixes
- TLS support
- Graceful shutdown
- Backups
- Log rotation
- Audit logging

---

## Recommendation

**For v2.0 Release**:
- Fix failed tests (3 items)
- Add event collector authentication
- Add message broker authentication
- Document security limitations

**For v2.1**:
- Rate limiting
- TLS support
- Graceful shutdown

**For v3.0**:
- Full audit logging
- Multi-user RBAC
- Encrypted database

---

**Current Status**: Acceptable for single-user localhost use
**Network Deployment**: Requires P0 + P1 fixes
**Enterprise**: Requires all fixes + more
