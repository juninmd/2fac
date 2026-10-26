# Security Policy

## Overview

2FAC (Two-Factor Authentication Client) is a desktop application for managing two-factor authentication codes. Security is paramount for this application as it handles sensitive authentication secrets.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email security@2fac.app (or contact the maintainers directly)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Security Features

### Data Protection
- **AES-256-GCM Encryption**: All exported backups are encrypted using AES-256-GCM
- **Argon2id Key Derivation**: Keys are derived from the master password with Argon2id (`argon2` package) and a random salt
- **Secure Random Generation**: Salt and IV are generated using cryptographically secure random bytes
- **Master Password Protection**: Application requires authentication before access

### Application Security
- **Context Isolation**: Renderer process is isolated from main process via contextBridge
- **No Node Integration**: Renderer cannot access Node.js APIs directly
- **Sandbox Mode**: Renderer runs in sandboxed environment
- **Content Protection**: Screen capture is blocked to prevent secret leakage

### Secure IPC
- All communication between processes uses defined IPC channels
- No remote module exposure
- Type-safe preload API

## Known Security Considerations

### Password Hashing
The master password is run through Argon2id (see Data Protection); the derived key is stored as a SHA-256 digest for verification.

### Storage
- Secrets are stored using electron-store (encrypted at rest on supported platforms)
- Consider enabling encryption for electron-store in future versions

## Dependencies

We use Dependabot for automated dependency updates:
- Weekly scans for vulnerability updates
- Grouped updates for production and development dependencies
- Automated PR creation for security patches

### Auditing Dependencies
```bash
# Check for known vulnerabilities
npm audit

# Fix automatically when possible
npm audit fix

# Review detailed report
npm audit --json
```

## Development Security Guidelines

### Environment Variables
- Never commit `.env` files
- Use `.env.example` for documentation
- Load secrets via `process.env` only

### Secrets Management
- Use GitHub Secrets for CI/CD credentials
- Rotate API keys regularly
- Implement least-privilege access

### Code Security
- Validate all user inputs
- Use parameterized queries (if database is added)
- Implement rate limiting for any API endpoints
- Sanitize error messages in production

### Build Security
- Enable code signing for releases
- Use reproducible builds
- Implement build artifact verification

## OWASP Top 10 Compliance

| Category | Status | Notes |
|----------|--------|-------|
| A01: Broken Access Control | ✅ | Master password protection |
| A02: Cryptographic Failures | ⚠️ | Consider upgrading password hashing |
| A03: Injection | ✅ | No SQL/database, input validation |
| A04: Insecure Design | ✅ | Security-first architecture |
| A05: Security Misconfiguration | ⚠️ | DevTools open in dev mode |
| A06: Vulnerable Components | ✅ | Dependabot monitoring |
| A07: Auth Failures | ✅ | Password protection implemented |
| A08: Data Integrity | ✅ | AES-256-GCM encryption |
| A09: Logging & Monitoring | ⚠️ | Consider adding telemetry |
| A10: SSRF | ✅ | Desktop app, no server-side |

## Security Checklist for Contributors

Before submitting a PR, ensure:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation for all user inputs
- [ ] Proper error handling (no sensitive data in errors)
- [ ] No console.log of sensitive data
- [ ] Dependencies are up to date
- [ ] No new security vulnerabilities introduced

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial security policy |

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
