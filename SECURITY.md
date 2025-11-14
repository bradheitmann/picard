# Security Policy

## PICARD Security Guidelines

PICARD is designed with security in mind, but proper configuration is essential.

---

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: [your-security-email@example.com] (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We'll respond within 48 hours.

---

## Security Best Practices

### 1. Never Commit Secrets

**DO NOT** commit:
- API keys
- Access tokens
- Passwords
- Personal file paths
- Project-specific data
- Database files
- Log files

**.gitignore protects you**, but always review before `git push`.

### 2. Use config.yaml.example

- Never commit your actual `config.yaml`
- Use `config.yaml.example` as template
- Store secrets in environment variables or separate secrets manager

### 3. Sanitize Before Sharing

If sharing configurations or logs:
```bash
# Use sanitization script
~/.dev/scripts/sync-to-opensource

# Manually review output
cd ~/picard-open-source
grep -r "YOUR_USERNAME\|YOUR_EMAIL\|API_KEY" .
```

### 4. Database Security

- Database contains agent activity logs
- May include file paths, project names
- Never share `observability.db` file
- Use in-memory database for demos: `sqlite3 :memory:`

### 5. Event Collector Security

The HTTP event collector:
- Runs on `localhost` only by default
- No authentication built-in
- DO NOT expose to public internet without adding auth layer

If exposing:
- Add API key authentication
- Use HTTPS with TLS
- Implement rate limiting
- Add IP allowlist

### 6. Platform Bridges

Bridge scripts may contain:
- Platform API keys
- Access tokens
- Project paths

Always sanitize before sharing.

---

## Security Checklist

Before open sourcing or sharing:

- [ ] Run `sync-to-opensource` script
- [ ] Review all files for PII
- [ ] Check no secrets in code
- [ ] Verify .gitignore is comprehensive
- [ ] Test with fresh install
- [ ] Review logs for sensitive data
- [ ] Confirm no personal paths
- [ ] Validate no email addresses (except official)
- [ ] Check no API keys or tokens

---

## What's Safe to Share

✅ **Safe**:
- Core PICARD code
- Database schema (SQL)
- Documentation
- Templates
- Examples with placeholder data
- .gitignore
- LICENSE

⚠️ **Sanitize First**:
- Configuration files
- Agent constitutions (may have project names)
- Manifests (may have paths)
- Bridge scripts (may have tokens)

❌ **NEVER Share**:
- `observability.db` (contains logs)
- `logs/` directory
- `config.yaml` (your actual config)
- Event streams (.jsonl files)
- Secrets or API keys

---

## Environment Variables

Use environment variables for sensitive data:

```bash
export PICARD_API_KEY="your-key"
export PICARD_DB_PASSWORD="your-password"
```

Access in code:
```python
import os
api_key = os.getenv("PICARD_API_KEY")
```

Never hard-code secrets.

---

## Audit Trail

PICARD logs all events. To audit:

```sql
-- Check recent events
SELECT * FROM events ORDER BY timestamp DESC LIMIT 100;

-- Check agent activity
SELECT agent_id, COUNT(*) FROM events GROUP BY agent_id;

-- Check for anomalies
SELECT * FROM agent_health WHERE anomaly_detected = 1;
```

---

## Updates

When updating PICARD:
1. Pull latest from GitHub
2. Review CHANGELOG for security notes
3. Update dependencies: `pip3 install --upgrade rich textual`
4. Re-run database migrations if needed

---

## Responsible Disclosure

We appreciate responsible disclosure of security issues.

**Timeline**:
- Report received: Acknowledged within 48 hours
- Initial assessment: Within 1 week
- Fix developed: Depends on severity
- Fix released: Coordinated disclosure

---

## License

PICARD is MIT licensed. See LICENSE file.

---

**🖖 Stay secure. Make it so.**
