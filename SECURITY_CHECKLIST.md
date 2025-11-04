# Security Checklist

This checklist helps ensure security best practices are followed when working on `pr-cleaner-ai`.

## Pre-commit Security Checks

Before committing code, verify:

- [ ] **No hardcoded secrets** — no tokens, API keys, passwords in code
- [ ] **No `exec()` or `execSync()` with user input** — use `spawn()` with array arguments
- [ ] **Path validation** — all file paths use `path.resolve()` and validated
- [ ] **Input validation** — all user inputs (PR numbers, owner/repo) are validated
- [ ] **No `eval()` or `Function()`** — never use dynamic code execution
- [ ] **No unsafe `JSON.parse()`** — validate JSON before parsing if from external source
- [ ] **Dependencies audited** — run `npm audit --omit=dev` before commit

## Pre-publish Security Checks

Before publishing to npm:

- [ ] **Build successful** — `npm run build` passes without errors
- [ ] **No source maps in dist/** — verified by CI workflow
- [ ] **Security audit clean** — `npm audit --omit=dev` shows 0 vulnerabilities
- [ ] **Package files validated** — only intended files in `package.json` → `files`
- [ ] **Published with provenance** — use `npm publish --provenance`
- [ ] **Version bumped** — following semver

## Code Review Security Focus

When reviewing PRs, check for:

### Command Execution
- [ ] Uses `spawn()` or `spawnSync()` with **array arguments** (not string concatenation)
- [ ] No shell injection vectors
- [ ] Inputs validated before command execution

### File Operations
- [ ] Uses `path.resolve()` for path normalization
- [ ] Paths validated to prevent directory traversal
- [ ] Write locations restricted to safe directories

### API Calls
- [ ] Owner/repo validated with regex `/^[a-zA-Z0-9._-]+$/`
- [ ] PR numbers validated as integers in range 1-999999
- [ ] No direct HTTP calls (uses `gh api` only)

### Dependencies
- [ ] No new dependencies added without review
- [ ] Production dependencies minimal and pinned
- [ ] Dev dependencies clearly separated

## Security Testing

Regular security checks:

- [ ] **Weekly:** Run `npm audit --omit=dev`
- [ ] **On PR:** CodeQL analysis runs automatically
- [ ] **Weekly:** OpenSSF Scorecard runs automatically
- [ ] **Before release:** Full security audit

## Incident Response

If a security vulnerability is discovered:

1. **Do NOT** open a public issue
2. Email security report to: `lukasz.jakubowski1993@gmail.com`
3. Include: description, steps to reproduce, impact, suggested fix
4. Response within 48 hours
5. Fix before disclosure

## Security Tools Used

- ✅ **CodeQL** — static analysis (SAST)
- ✅ **OpenSSF Scorecard** — security metrics
- ✅ **npm audit** — dependency vulnerability scanning
- ✅ **GitHub Security Advisories** — coordinated disclosure

## Known Safe Patterns

These patterns are safe and used in this codebase:

```typescript
// ✅ Safe: spawnSync with array arguments
spawnSync('gh', ['api', endpoint, '--paginate'], {
  encoding: 'utf-8'
});

// ✅ Safe: path.resolve with validation
const resolvedPath = path.resolve(basePath, relativePath);
if (!resolvedPath.startsWith(basePath)) {
  throw new Error('Path traversal detected');
}

// ✅ Safe: input validation before use
if (!/^\d+$/.test(prNumber)) {
  throw new Error('Invalid PR number');
}
```

## Known Unsafe Patterns (Avoid)

These patterns should NEVER be used:

```typescript
// ❌ UNSAFE: execSync with string concatenation
execSync(`gh api ${endpoint}`, { shell: true });

// ❌ UNSAFE: path without validation
fs.readFileSync(userInput, 'utf-8');

// ❌ UNSAFE: eval or Function
eval(userInput);
new Function(userInput)();

// ❌ UNSAFE: JSON.parse without validation
JSON.parse(untrustedInput);
```

---

**Last Updated:** 2025-01-27  
**Maintained by:** pr-cleaner-ai maintainers

