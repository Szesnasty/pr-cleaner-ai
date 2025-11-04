# Changelog

## [1.2.8](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.2.7...v1.2.8) (2025-11-04)


### Bug Fixes

* **security:** add top-level permissions to all workflows ([5bb806f](https://github.com/Szesnasty/pr-cleaner-ai/commit/5bb806f1a91254a3eb3cfafe2791e1e09cfc301c))

## [1.2.7](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.2.6...v1.2.7) (2025-11-04)


### Bug Fixes

* **security:** pin all GitHub Actions versions and improve permissions ([d625320](https://github.com/Szesnasty/pr-cleaner-ai/commit/d625320f51c8523bcc9377f47ed9fd94286b146d))


### Documentation

* add Branch Protection setup guide ([d9367d6](https://github.com/Szesnasty/pr-cleaner-ai/commit/d9367d64f8955e76bed8bcb0729a07a05e7c9b23))

## [1.2.6](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.2.5...v1.2.6) (2025-11-04)


### Miscellaneous Chores

* **deps:** update dependencies to latest versions ([3d93bf9](https://github.com/Szesnasty/pr-cleaner-ai/commit/3d93bf991c2e0f1abecc466cc3c7d8f4ea258386))

## [1.2.5](https://github.com/Szesnasty/pr-cleaner-ai/compare/v1.2.4...v1.2.5) (2025-11-04)


### Bug Fixes

* add clean:maps step to CI and fix Release Please permissions ([f5efc7c](https://github.com/Szesnasty/pr-cleaner-ai/commit/f5efc7ccbc827b6445c19d80b1a8c71f7a3b00f5))
* allow .d.ts files in tarball and use config file for Release Please ([b4a698e](https://github.com/Szesnasty/pr-cleaner-ai/commit/b4a698e2775031342c43e3e75a4dc9245bc5456e))
* disable component in tag name for Release Please ([69b10ff](https://github.com/Szesnasty/pr-cleaner-ai/commit/69b10ffd121392389c46c3aeafb6616c9b888f4c))
* update OpenSSF Scorecard action version to v2.3.1 ([1ade4b4](https://github.com/Szesnasty/pr-cleaner-ai/commit/1ade4b48cc5b01b13264ab3283512084ca5f6e6b))
* update release-please manifest format ([021bf24](https://github.com/Szesnasty/pr-cleaner-ai/commit/021bf2416966788664328c7beb7cc67cf1a4e160))
* use googleapis/release-please-action instead of deprecated google-github-actions ([e6b0120](https://github.com/Szesnasty/pr-cleaner-ai/commit/e6b01208cdca09caef040dedff851ccaeccc8adf))


### Miscellaneous Chores

* trigger Release Please after permissions update ([09ed010](https://github.com/Szesnasty/pr-cleaner-ai/commit/09ed0103c4396b3dbd7a83fbe11fc9f0dbdcb7dc))

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
