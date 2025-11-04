# Changelog

## [1.2.4](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.2.3...v1.2.4) (2025-11-04)

### 🔧 Maintenance & Infrastructure

* **community**: Added comprehensive GitHub templates and community files
* **github**: Added PR template with detailed checklist
* **github**: Added Issue templates (bug report, feature request)
* **github**: Configured Dependabot for npm and GitHub Actions
* **github**: Added Release Please workflow for automated releases
* **github**: Added FUNDING.yml for GitHub Sponsors
* **docs**: Added CODE_OF_CONDUCT.md (Contributor Covenant 2.0)
* **readme**: Enhanced badges (Node.js version, Package Health, Security Audit)
* **security**: Completed comprehensive security audit with 4.9/5 score

### 📊 Metrics Improvements

* Package Health Score optimization for better npm ecosystem visibility
* Enhanced OpenSSF Scorecard compliance
* Improved Snyk Advisor metrics

---

## [1.2.3](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.2.2...v1.2.3) (2025-11-04)

### Features

* Auto-detect PR number from current branch (no --pr flag needed)
* Enhanced error messages with helpful troubleshooting steps
* GraphQL API for faster comment fetching with resolved status
* Batch commit mode with configurable thresholds

### Security

* Comprehensive security audit completed
* All inputs validated before API calls
* Command injection prevention with spawnSync + array arguments
* Path traversal protection with path.resolve()

---

## [1.2.0](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.1.0...v1.2.0) (2025-11-01)

### Features

* Commit batch mode for better workflow management
* Additional rules support in config
* Enhanced Cursor integration with better prompts

---

## [1.1.0](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.0.0...v1.1.0) (2025-10-30)

### Features

* Improved comment grouping by file and line
* Better markdown output formatting
* Statistics and progress tracking

---

## [1.0.0](https://github.com/Szesnasty/pr-cleaner-ai/releases/tag/v1.0.0) (2025-10-28)

### 🎉 Initial Release

* Fetch GitHub PR comments via GitHub CLI
* Cursor AI integration with `.mdc` rules
* Interactive and auto-fix modes
* Security-first design (no token management)
* Support for GitHub.com and GitHub Enterprise
* Comprehensive documentation

