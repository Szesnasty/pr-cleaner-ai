# Security Policy

## Supported Versions

We actively maintain security updates for the current major version:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**🔒 Security is a priority for `pr-cleaner-ai`.**

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue** — vulnerabilities should be reported privately
2. **Email security report to:** `lukasz.jakubowski1993@gmail.com`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue before disclosure.

**SLA:**
- Initial response: within 48 hours
- Fix/mitigation: within 14 days (subject to complexity)
- Coordinated disclosure after fix is available

## Security Features

### Local-Only Execution
- ✅ **No cloud processing** — all code runs on your local machine
- ✅ **No telemetry or analytics** — zero data collection, tracking, or usage statistics in any form
- ✅ **No network calls** in postinstall script — respects `PR_CLEANER_AI_SKIP_POSTINSTALL=1`
- ✅ **Limited network communication** — only `gh api` calls to GitHub.com or GitHub Enterprise; no direct HTTP requests

### Authentication
- ✅ **Uses GitHub CLI (`gh`)** — no personal access tokens stored in repo
- ✅ **No token management** — leverages your existing `gh auth login`
- ✅ **Supports GitHub Enterprise** — via `--hostname` flag

### File System Safety
- ✅ **Path validation** — all file operations use `path.resolve()` to prevent directory traversal
- ✅ **Restricted write locations** — only writes to:
  - `.cursor/rules/pr-cleaner-ai.mdc` (local config)
  - `.pr-cleaner-ai-output/` (temporary output files)
- ✅ **Gitignored output** — generated files never committed to repo

### Command Execution Safety
- ✅ **No shell injection** — uses `spawn()` with array arguments, never string concatenation
- ✅ **PR number validation** — validates `/^\d+$/` before API calls
- ✅ **GitHub CLI only** — no direct HTTP calls, uses `gh api` for all GitHub operations

### Dependencies
- ✅ **Minimal dependencies** — only essential packages
- ✅ **Pinned versions** — no wildcards in production dependencies
- ✅ **Regular audits** — `npm audit --omit=dev` recommended

## Published with Provenance

This package is published with:
- ✅ **npm provenance** — `npm publish --provenance`
- ✅ **2FA enabled** — required for package maintainers

## Security Best Practices

### For Users

1. **Keep dependencies updated:**
   ```bash
   npm audit --omit=dev
   npm update pr-cleaner-ai
   ```

2. **Verify GitHub CLI authentication:**
   ```bash
   gh auth status
   ```

3. **Review generated files** before committing:
   - `.cursor/rules/pr-cleaner-ai.mdc` (auto-generated)
   - `.pr-cleaner-ai-output/` (temporary)

4. **Skip postinstall if needed:**
   ```bash
   PR_CLEANER_AI_SKIP_POSTINSTALL=1 npm install
   ```

### For Maintainers

- Always run `npm audit` before publishing
- Use `npm publish --provenance` for supply chain security
- Keep `devDependencies` separate from `dependencies`
- Review all PRs for security implications

## Known Limitations

- Requires GitHub CLI (`gh`) to be installed and authenticated
- Works with GitHub.com and GitHub Enterprise Server
- No support for private Git servers (GitLab, Bitbucket, etc.)

## Disclaimer

This software is provided "as is", without warranty of any kind. By using it you accept the risks associated with third-party dependencies and local Git operations. See LICENSE for details.

## Security Contact

**Primary:** `lukasz.jakubowski1993@gmail.com`

**GitHub Issues:** For non-security bugs, use [GitHub Issues](https://github.com/Szesnasty/pr-cleaner-ai/issues)

---

**Last Updated:** 2025-01-27

