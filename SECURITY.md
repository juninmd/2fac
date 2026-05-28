# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within 2FAC, please send an email to the repository maintainer. All security vulnerabilities will be promptly addressed.

**Please do NOT report security vulnerabilities through public GitHub issues.**

## Security Measures

### 1. Data Protection

- **Encryption at Rest**: All 2FA secrets are encrypted using AES-256-GCM when exported with a password
- **Key Derivation**: PBKDF2 with 100,000 iterations for password-based key derivation
- **Secure Storage**: Uses `electron-store` for local encrypted storage
- **No Network Requests**: All operations are performed locally - no data is sent to external servers

### 2. Electron Security

- **Context Isolation**: Enabled (`contextIsolation: true`) to prevent renderer process access to Node.js APIs
- **Node Integration Disabled**: Renderer cannot access Node.js APIs directly
- **Sandbox Mode**: Enabled for additional isolation
- **Content Protection**: Prevents screen capture of sensitive data
- **Preload Script**: Limited API surface exposed via `contextBridge`

### 3. Authentication

- **Master Password**: Stored as SHA-256 hash (consider upgrading to bcrypt/scrypt for production)
- **Password Verification**: Constant-time comparison to prevent timing attacks

### 4. Input Validation

- File imports validate file structure before processing
- Protobuf parsing validates schema compliance
- OTP URI parsing validates format before use

## Known Security Considerations

1. **Master Password Hashing**: Currently uses SHA-256. For production use, consider migrating to bcrypt or Argon2
2. **Local Storage**: Data is stored locally and not encrypted at rest (relies on OS file permissions)
3. **Screen Capture**: QR code scanner requires screen capture permissions

## Best Practices for Users

1. **Use a Strong Master Password**: Choose a long, unique password
2. **Export Encrypted Backups**: Always use encrypted exports for backups
3. **Keep Software Updated**: Ensure you're running the latest version
4. **Secure Your System**: Use full-disk encryption and strong login passwords
5. **Don't Share Backups**: Encrypted backups can still be brute-forced if the password is weak

## OWASP Top 10 Compliance

This application addresses OWASP Top 10 concerns:

| Category | Status | Notes |
|----------|--------|-------|
| A01: Broken Access Control | ✅ | Local-only access, no network exposure |
| A02: Cryptographic Failures | ✅ | AES-256-GCM encryption, PBKDF2 key derivation |
| A03: Injection | ✅ | Input validation on all imports |
| A04: Insecure Design | ✅ | Security-first architecture with Electron best practices |
| A05: Security Misconfiguration | ✅ | Secure Electron defaults enabled |
| A06: Vulnerable Components | ✅ | Dependabot configured for automated updates |
| A07: Authentication Failures | ⚠️ | Consider upgrading hash algorithm |
| A08: Data Integrity | ✅ | Cryptographic signatures on encrypted exports |
| A09: Logging & Monitoring | ⚠️ | Local-only logging, no external monitoring |
| A10: SSRF | ✅ | No network requests |

## Security Updates

Security updates will be released as patch versions and documented in release notes.

## References

- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
