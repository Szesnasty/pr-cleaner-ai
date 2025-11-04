# 🧹 pr-cleaner-ai

[![npm](https://img.shields.io/npm/v/pr-cleaner-ai.svg)](https://www.npmjs.com/package/pr-cleaner-ai)
[![downloads](https://img.shields.io/npm/dw/pr-cleaner-ai.svg)](https://www.npmjs.com/package/pr-cleaner-ai)
[![license](https://img.shields.io/badge/license-MIT-informational.svg)](LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Szesnasty/pr-cleaner-ai/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Szesnasty/pr-cleaner-ai)
[![CodeQL](https://github.com/Szesnasty/pr-cleaner-ai/actions/workflows/codeql.yml/badge.svg)](https://github.com/Szesnasty/pr-cleaner-ai/actions/workflows/codeql.yml)

Clean up your pull request in one command — directly in Cursor.

`pr-cleaner-ai` pulls review comments from a GitHub Pull Request, updates your local code, and walks you through resolving the threads — so after review you can get to merge without doing the boring cleanup loop.

**Everything runs locally.** `pr-cleaner-ai` talks to GitHub through your local `gh auth login`. Your code never leaves your machine, no personal access tokens are stored in the repo, and nothing is uploaded to any external service.

## 🚀 Quick Start (3 steps):

**1️⃣ Authenticate GitHub CLI:**
```bash
gh auth login
```

**2️⃣ Install and initialize in your project:**
```bash
npm install -D pr-cleaner-ai
npx pr-cleaner-ai init
```

**3️⃣ Use it in Cursor:**

Simply mention the PR number:

```
fix PR 123
```

Or any of these formats:
```
PR 123
PR#123
#123
resolve PR comments for 123
```

**That's it.** No tokens, no bot PRs, no complex setup.

> **How does Cursor know what to do?**  
> The `pr-cleaner-ai.mdc` rule teaches Cursor how to react when you mention a PR number.  
> You don't have to copy/paste comments or tell it what to do — it already knows to fetch the PR, group the comments, and start applying fixes.

---

## ✨ Features

- ✅ Fetch all comments from any GitHub Pull Request
- ✅ Run directly in Cursor — just type `fix PR 123`
- ✅ Groups review comments by file/line so you see exactly what needs to change
- ✅ Optional auto-fix mode (`autoFix: true`) to apply fixes automatically
- ✅ **Stays in your branch** — no bot PRs, no detached workspaces
- ✅ **Uses GitHub CLI for authentication** – no token management needed!
- ✅ Works with any language (Java, Python, Go, JavaScript, etc.)
- ✅ **Non-intrusive setup** – you control what gets configured

---

## 🤯 Why this matters

Before:
- 12 unresolved review comments
- jumping file to file fixing nitpicks ("rename this", "add null check", "please add test", "typo here")
- push, wait, repeat

After:
- `fix PR 2146`
- `pr-cleaner-ai` fetches all comments from the PR
- shows what each reviewer asked for, file by file
- proposes the actual code change
- you just confirm `[y/n]`

Result: branch is mergeable in minutes instead of an hour of cleanup.

---

## 📦 Installation

```bash
npm install -D pr-cleaner-ai
# or
yarn add -D pr-cleaner-ai
# or
pnpm add -D pr-cleaner-ai
```

Requires Node.js >=16 (runtime only — your repo can be any language).

> **Note:** This is a **development tool** for PR review workflow. Install as devDependency (`-D` flag).

---

## ⚡ Setup

### 1. Dependencies

**GitHub CLI is required.** If you don't have it:

**macOS:**
```bash
brew install gh
```

**Windows:**
```bash
winget install --id GitHub.cli
```

**Linux:**  
See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

**Then authenticate:**
```bash
gh auth login
```

---

### 2. Initialize the package

**⚠️ REQUIRED:** After installation, you MUST run:

```bash
npx pr-cleaner-ai init
```

This will:
- Copy `.cursor/rules/pr-cleaner-ai.mdc` from npm package (Cursor AI integration)
- Add `.pr-cleaner-ai-output/` and `.cursor/rules/pr-cleaner-ai.mdc` to `.gitignore`
- Ensure generated files are properly ignored by Git

**Important:** Without running `init`, generated files may appear in your Git changes.

Optional: add npm scripts to `package.json`:
```bash
npx pr-cleaner-ai init --with-scripts
```

---

### 3. Commit configuration files (for team)

```bash
git add .gitignore
git commit -m "chore: configure pr-cleaner-ai"
```

**Important:** 
- `.cursor/rules/pr-cleaner-ai.mdc` is automatically gitignored (added by `init`)
- To update rules file to match new package version, run `npx pr-cleaner-ai init` again
- No need to commit `.cursor/rules/pr-cleaner-ai.mdc` or `.pr-cleaner-ai-output/` - they're generated files
- Each team member needs GitHub CLI authenticated (`gh auth login`)

---

### 4. Use in Cursor

In any file or chat inside Cursor, mention the PR number:

```txt
fix PR 2146
```

Or any of these formats:
```txt
PR 2146
PR#2146
#2146
resolve PR comments for 2146
apply fixes from PR 2146
```

**How it works:** Cursor automatically detects PR references and activates the `pr-cleaner-ai` workflow from `.cursor/rules/pr-cleaner-ai.mdc`.

> **💡 Tip:** If Cursor doesn't activate the rule automatically, you can add `.cursor/rules/pr-cleaner-ai.mdc` to your chat context manually, and make sure you're in **Agent mode** (not Composer mode) for full workflow support.

You'll get something like:

```txt
🔎 PR #2146 found (12 comments)
📂 Affected files:
 - src/auth/login.ts (5)
 - src/auth/utils/formatError.ts (2)
 - tests/login.spec.ts (1)

⚙ Mode: interactive (autoFix: false)

login.ts:42
Reviewer: "rename tmp → sessionToken"
→ Apply this change? [y/n]

formatError.ts:18
Reviewer: "handle null case"
→ Apply this change? [y/n]
```

Cursor will walk you through each comment and propose code updates.

---

### 5. Or run from terminal

Specify the PR number:
```bash
npx pr-cleaner-ai fetch --pr=2146
```

This will fetch and group PR comments locally without going through Cursor.

---

## 🔧 Commands

```bash
# Initialize pr-cleaner-ai (run once per project)
npx pr-cleaner-ai init

# Initialize with package.json scripts  
npx pr-cleaner-ai init --with-scripts

# Fetch PR comments
npx pr-cleaner-ai fetch --pr=2146

# Check environment (Cursor rules present, gh authenticated, etc.)
npx pr-cleaner-ai check
```

---

## ⚙️ Configuration (optional, power users)

Create `.pr-cleaner-ai.config.json` if you want to change how fixes are applied:

```json
{
  "autoFix": false,
  "additionalRules": [
    ".cursor/rules/coding-standards.mdc",
    ".cursor/rules/testing-requirements.mdc"
  ],
  "commitBatch": {
    "threshold": {
      "comments": 2
    }
  }
}
```

Options:
- `autoFix: false` (default) – interactive mode, asks before each patch  
- `autoFix: true` – hands-free mode, applies all fixes automatically
- `additionalRules` (optional) – array of rule file paths that Cursor should consider when resolving PR comments. These files will be automatically referenced in the generated markdown output.
- `commitBatch.threshold.comments` (optional) – after fixing this many comments, Cursor will:
  - ✅ Stop and show what was fixed
  - 💡 **Suggest** a commit message (never auto-commits!)
  - ⏸️ Wait for your approval before continuing
  - 🔄 Show brief summary of what's done vs what's remaining
  
  Example: if set to `2` and there are 10 comments, Cursor will fix 2 comments, suggest a commit, wait for you to commit, then continue with the next batch.

---

## 📋 Requirements

- Node.js >= 16.0.0 (runtime only)
- Git  
- **GitHub CLI (`gh`)** – installed and authenticated
- **Intended to be installed as a devDependency** – this is a development tool, not a production runtime library

**`pr-cleaner-ai` talks to GitHub only through `gh api`, using your existing `gh auth login`.**

---

## 🔒 Security

**`pr-cleaner-ai` never asks for a personal access token and never uploads your code anywhere.**

We take your repo security seriously:

**What this means:**
- ✅ **No cloud processing** – runs on your laptop
- ✅ **No token management** – uses GitHub CLI
- ✅ **No data collection** – zero telemetry
- ✅ **Built with security best practices**
- ✅ **Published with provenance** – `npm publish --provenance` for supply chain security
- ✅ **2FA enabled** – required for package maintainers

### File Protection
- ✅ Output folder (`.pr-cleaner-ai-output/`) is gitignored
- ✅ Cursor rules file (`.cursor/rules/pr-cleaner-ai.mdc`) is gitignored

### Security Features
- ✅ **Path validation** – all file operations use `path.resolve()` to prevent directory traversal
- ✅ **Input validation** – PR numbers, owner/repo names validated before API calls
- ✅ **Command injection prevention** – uses `spawn()` with array arguments, never string concatenation
- ✅ **No network calls in postinstall** – respects `PR_CLEANER_AI_SKIP_POSTINSTALL=1`

See [SECURITY.md](SECURITY.md) for detailed security information and vulnerability reporting.

---

## 🌍 Supported Languages

`pr-cleaner-ai` works with any language supported by Cursor AI, including but not limited to:

- Java, Kotlin, Scala  
- Python, JavaScript, TypeScript  
- Go, Rust, C, C++, C#  
- Ruby, PHP, Swift  
- ...and more

You can run `pr-cleaner-ai` in polyglot monorepos.

---

## 🤔 Why This Approach?

Unlike other tools that automatically modify your files during installation, `pr-cleaner-ai` gives you control:

✅ **You choose** when to initialize  
✅ **No surprises** in git status  
✅ **Team-friendly** – explicit configuration commits  
✅ **Optional scripts** – add to package.json only if you want  
✅ **No token management** – uses GitHub CLI for secure authentication

**`pr-cleaner-ai` never creates its own bot branch or opens PRs on your behalf** — it works in your current branch, with your code, under your name.

**What gets created after `pr-cleaner-ai init`:**

**Files NOT to commit (gitignored automatically):**
- `.pr-cleaner-ai-output/` – Temporary PR comment files
- `.cursor/rules/pr-cleaner-ai.mdc` – Auto-updated Cursor rules (gitignored)

**Optional configuration:**
- Create `.pr-cleaner-ai.config.json` manually if you want to customize behavior:
  ```json
  { "autoFix": true }
  ```
  This enables auto-apply fixes without asking (default is `false` - interactive mode)

---

## 🤝 Contributing

Issues and pull requests are welcome.  
If you hit an edge case in comment parsing or patch generation, please open an issue with:
- PR number
- example comment
- expected vs actual behavior

---

## 📄 License

MIT

---

## ❓ FAQ

### What happens when I switch branches?

When you leave a branch:
- `.pr-cleaner-ai-output/` is gitignored (won't follow you)
- `.cursor/rules/pr-cleaner-ai.mdc` is gitignored (will be recreated if needed)

When you come back to that branch:
- if `pr-cleaner-ai` is still in `node_modules`, the Cursor rule file is automatically recreated
- if it's not installed anymore, just run `npm install` again

---

### Cursor doesn't activate the rule when I mention a PR number

If `fix PR 123` doesn't trigger the workflow automatically:

1. **Add the rule file to context manually:**
   - Click `@` in Cursor chat
   - Select `.cursor/rules/pr-cleaner-ai.mdc`
   - Then try `fix PR 123` again

2. **Make sure you're in Agent mode:**
   - Use Cursor's **Agent mode** (not Composer mode) for full workflow support
   - Agent mode allows multi-step actions and file execution

3. **Verify the rule file exists:**
   ```bash
   ls .cursor/rules/pr-cleaner-ai.mdc
   ```
   If missing, run `npx pr-cleaner-ai init` again.

---

## 🔗 Links

- [GitHub Repository](https://github.com/Szesnasty/pr-cleaner-ai)
- [Issues](https://github.com/Szesnasty/pr-cleaner-ai/issues)

---

Made with ❤️ for developers who are tired of babysitting pull request feedback.

**Author:** [Szesnasty](https://github.com/Szesnasty) (Łukasz Jakubowski)
