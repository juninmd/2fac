# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

This is a local-first desktop application. All 2FA data remains on your device and is never transmitted over the network.

If you discover a security vulnerability, please report it by emailing the repository maintainer. Do **not** create a public GitHub issue for security vulnerabilities.

## Security Architecture

### Threat Model

2FAC is designed as a **local-only** 2FA token manager. The primary threats are:

1. **Local Malware** - Malware on the host system could read unencrypted data at rest
2. **Screen Capture** - Malware or other applications capturing screen contents
3. **Unauthorized Local Access** - Someone with physical or remote access to the machine
4. **Backup Interception** - Backup files being read if exfiltrated

### Countermeasures

| Threat | Mitigation |
|--------|------------|
| Data at rest | `electron-store` with encryption key |
| Master password | PBKDF2 with 600,000 iterations, 32-byte salt |
| Screen capture | `setContentProtection(true)` prevents capturing window |
| IPC access | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| Export security | AES-256-GCM encrypted backup with PBKDF2 key derivation |
| Auto-lock | Configurable inactivity timer (default: 5 min) |
| Window blur | Automatically blurs content when window loses focus |

### Cryptographic Standards

- **Password Hashing**: PBKDF2-SHA256, 600,000 iterations, 32-byte random salt
- **Data Encryption**: AES-256-GCM (for encrypted backups)
- **Key Derivation**: PBKDF2 with 100,000 iterations (backup export)

## Security Best Practices

### For Users

1. **Set a strong master password** - At least 8 characters, mix of letters, numbers, and symbols
2. **Enable auto-lock** - Automatically locks the app after inactivity
3. **Keep the app updated** - Always use the latest version for security patches
4. **Use encrypted backups** - Always encrypt exported backup files
5. **Lock when away** - Use Ctrl/Cmd + L to manually lock the app

### For Developers

1. **Input Validation** - All user inputs are validated before processing
2. **No `eval` or dynamic code execution** - The app never executes dynamic code
3. **Minimal IPC surface** - Only necessary functions are exposed via `contextBridge`
4. **No remote modules** - All Electron `remote` module usage is avoided
5. **Strict TypeScript** - The codebase enforces strict typing
6. **Dependency scanning** - Dependabot is configured for automated security updates

## Security Audit Checklist

### Application Security
- [x] Context isolation enabled
- [x] Node integration disabled
- [x] Sandbox mode active
- [x] Content protection enabled
- [x] No remote modules used
- [x] Strict TypeScript mode

### Data Security
- [x] Storage encrypted at rest
- [x] Passwords hashed with PBKDF2
- [x] AES-256-GCM for backup encryption
- [x] Secure random values (crypto.randomBytes)

### Code Quality
- [x] No `any` types in main process
- [x] Error messages do not leak internals
- [x] Dev mode correctly gated by NODE_ENV

### Supply Chain
- [x] Dependabot configured for npm, GitHub Actions, Docker
- [x] Automated security scanning (GitLeaks)
- [x] Dependency groups and reviewers configured

## Vulnerability Disclosure

If you believe you've found a security issue, please contact the maintainer directly. We will acknowledge receipt within 48 hours and provide a timeline for a fix.
