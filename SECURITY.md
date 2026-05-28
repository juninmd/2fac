# Security Policy

## Reporting a Vulnerability

To report a security vulnerability, please use the [GitHub Security Advisory](https://github.com/juninmd/2fac/security/advisories) feature or email security@juninmd.com.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### Secrets Management
- All sensitive data should be stored in environment variables
- Never commit secrets to the repository
- Use `.gitignore` to exclude files containing secrets
- Keys and certificates should be stored securely

### Dependency Security
- Dependencies are regularly updated via Dependabot
- Security vulnerabilities are scanned using npm audit
- Critical vulnerabilities are addressed promptly

### Code Security
- Input validation is implemented for all user inputs
- Parameterized queries are used to prevent injection attacks
- Rate limiting is implemented on APIs
- Proper authentication and authorization mechanisms are in place

### CI/CD Security
- Secrets are stored in GitHub Secrets, never in code
- Least-privilege permissions are used for CI tokens
- Secret scanning is implemented in CI pipeline
- SAST tools are used for static analysis

## Security Features

### Electron Security
- Context isolation is enabled
- Node integration is disabled in renderers
- Secure IPC communication via contextBridge
- Content security policies are implemented

### Data Protection
- Sensitive data is encrypted at rest using AES-256
- Secure storage mechanisms are used for credentials
- Regular security audits are conducted

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Electron Security Guidelines](https://www.electronjs.org/docs/tutorial/security)
- [Node.js Security Checklist](https://github.com/nodejs/security-wg/blob/main/doc/nodejs_security_checklist.md)