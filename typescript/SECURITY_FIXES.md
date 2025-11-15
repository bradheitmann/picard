# PICARD Security Fixes Required

## 🚨 CRITICAL VULNERABILITIES

### 1. Database File Permissions (CRITICAL)
**Issue**: observability.db is world-readable (rw-r--r--)
**Risk**: Any user on system can read all agent data, project info, costs
**Fix**:
```bash
chmod 600 ~/.dev/logs/observability.db
```

**Auto-fix on startup**:
```typescript
// src/db.ts constructor
const dbPath = join(homedir(), '.dev/logs/observability.db');
this.db = new Database(dbPath);

// Fix permissions immediately
if (process.platform !== 'win32') {
  const fs = require('node:fs');
  fs.chmodSync(dbPath, 0o600); // Owner read/write only
}
```

---

### 2. Event Collector - No Authentication (CRITICAL)
**Issue**: Anyone on localhost can POST fake events
**Risk**: Event poisoning, false metrics, data corruption
**Fix**: Add API key authentication
```typescript
// event-collector.py
PICARD_API_KEY = os.getenv('PICARD_API_KEY') or generate_key()

def do_POST(self):
    api_key = self.headers.get('X-Picard-API-Key')
    if api_key != PICARD_API_KEY:
        self.send_response(403)
        return
    # Process event...
```

---

### 3. Shell Injection in execSync (CRITICAL)
**Issue**: Unsanitized paths passed to shell
**Risk**: Command injection if project path contains backticks or $()
**Current**:
```typescript
execSync(`${bridge} deploy ${agent} ${project}`, { stdio: "inherit" });
```

**Fix**: Use array form or sanitize
```typescript
// Sanitize input
function sanitizePath(path: string): string {
  return path.replace(/[`$()]/g, '');
}

execSync(`${bridge} deploy ${sanitizePath(agent)} ${sanitizePath(project)}`,
  { stdio: "inherit" });

// Or better: use spawn with array args
import { spawn } from 'node:child_process';
spawn(bridge, ['deploy', agent, project], { stdio: 'inherit' });
```

---

### 4. Message Broker - Agent Impersonation (HIGH)
**Issue**: Any agent can send messages as any other agent
**Risk**: Malicious agent could send fake commands
**Fix**: Add agent authentication tokens
```typescript
// When agent connects, generate token
const agentToken = crypto.randomBytes(32).toString('hex');
// Store in database, require on message send

// Verify sender
async sendMessage(from: string, token: string, to: string, ...) {
  const validToken = this.getAgentToken(from);
  if (token !== validToken) {
    throw new Error('Invalid agent token');
  }
  // Process message...
}
```

---

### 5. No Input Validation (HIGH)
**Issue**: CLI accepts any input without validation
**Risk**: Buffer overflows, injection attacks
**Fix**: Validate all inputs
```typescript
function validateAgentId(id: string): void {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error('Invalid agent ID format');
  }
  if (id.length > 100) {
    throw new Error('Agent ID too long');
  }
}

function validatePath(path: string): void {
  const resolved = resolve(path);
  if (!resolved.startsWith(homedir())) {
    throw new Error('Path must be within home directory');
  }
}
```

---

## ⚠️ HIGH RISK

### 6. Bun Installation Not Verified
**Issue**: picard command fails if Bun not installed
**Risk**: User frustration, bad first experience
**Fix**: Better error message + install script
```bash
#!/bin/bash
# ~/.dev/scripts/picard

if [ ! -f "$HOME/.bun/bin/bun" ]; then
    echo "🖖 PICARD requires Bun"
    echo ""
    echo "Install now? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        curl -fsSL https://bun.sh/install | bash
        exec $SHELL  # Reload shell
    else
        exit 1
    fi
fi

# Continue with picard...
```

---

### 7. Port Conflicts Not Handled
**Issue**: Event collector fails if port 8765 in use
**Risk**: Silent failure, no events collected
**Fix**: Auto-select available port
```typescript
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const server = Bun.serve({ port, fetch: () => new Response() });
      server.stop();
      return port;
    } catch {
      continue;
    }
  }
  throw new Error('No available ports');
}

const PORT = await findAvailablePort(8765);
```

---

### 8. Database Schema Migration
**Issue**: Schema changes break existing databases
**Risk**: Data loss, crashes
**Fix**: Version migrations
```typescript
const SCHEMA_VERSION = 2;

// Check version
const version = db.prepare('PRAGMA user_version').get();

if (version < SCHEMA_VERSION) {
  // Run migrations
  runMigrations(version, SCHEMA_VERSION);
  db.prepare(`PRAGMA user_version = ${SCHEMA_VERSION}`).run();
}
```

---

## 📋 MEDIUM RISK

### 9. No Rate Limiting
**Issue**: Agent could spam events/messages
**Risk**: Database bloat, DOS
**Fix**: Rate limits per agent
```typescript
const rateLimits = new Map<string, number[]>();

function checkRateLimit(agentId: string): boolean {
  const now = Date.now();
  const window = rateLimits.get(agentId) || [];

  // Keep only last minute
  const recent = window.filter(t => now - t < 60000);

  if (recent.length > 100) {  // Max 100 events/min
    return false;
  }

  recent.push(now);
  rateLimits.set(agentId, recent);
  return true;
}
```

---

### 10. No Graceful Shutdown
**Issue**: Database corruption if killed during write
**Risk**: Data loss
**Fix**: Handle signals
```typescript
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
```

---

## 🔍 WHAT WILL BREAK FIRST

### Most Likely Failures (in order):

1. **Bun not installed** - 90% of users
   - Error: `bun: command not found`
   - Fix: Add check + install prompt

2. **Database doesn't exist** - Fresh installs
   - Error: `Database not initialized`
   - Fix: Auto-initialize on first run

3. **Event collector not running** - 80% of users
   - Symptom: No events in dashboard
   - Fix: Auto-start in picard wrapper (already done!)

4. **Port 8765 in use** - 20% of users
   - Error: `Address already in use`
   - Fix: Auto-find available port

5. **TypeScript files not found** - After OS reinstall
   - Error: `Cannot find module`
   - Fix: Check paths, better error messages

---

## 🛠️ PRIORITY FIXES

### P0 (Must Fix Before v2.1):
1. Database file permissions (chmod 600)
2. Input sanitization (SQL injection, shell injection)
3. Bun installation check with helpful error

### P1 (Should Fix):
4. Event collector authentication
5. Message broker authentication
6. Port conflict handling
7. Graceful shutdown

### P2 (Nice to Have):
8. Rate limiting
9. Schema migrations
10. Better error messages

---

## 🎯 RECOMMENDATIONS

**For v2.0 Release**:
- Document security limitations
- Add SECURITY.md with warnings
- Recommend: Run on trusted systems only

**For v2.1**:
- Implement P0 + P1 fixes
- Add authentication layer
- Harden all inputs

**For v3.0**:
- Multi-user support
- RBAC (Role-Based Access Control)
- Encrypted database
- TLS for event collector
