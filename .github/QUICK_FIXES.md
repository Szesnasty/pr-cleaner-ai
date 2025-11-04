# 🚀 Quick Fixes for OpenSSF Scorecard

## Current Score: 5.3/10 → Target: 7.5-8.0/10

### ✅ Already Fixed (via code):

1. **Token-Permissions** - All workflows use minimal permissions
2. **Pinned-Dependencies** - All GitHub Actions pinned to specific versions

### ⚠️ Needs Manual Setup (5 minutes):

#### 1. Enable Branch Protection

**Option A: Via GitHub UI (Recommended):**
1. Go to: https://github.com/Szesnasty/pr-cleaner-ai/settings/branches
2. Click "Add rule" next to "Branch protection rules"
3. Branch name pattern: `main`
4. Enable these settings:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: **1**
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
     - Select: `build (18.x)`, `build (20.x)`, `build (22.x)`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Do not allow force pushes
   - ✅ Do not allow deletions
5. Click "Create"

**Option B: Via Script (if you have gh CLI):**
```bash
./.github/setup-branch-protection.sh
```

**Expected Impact:**
- Branch-Protection: 0 → 10 (+10)
- Code-Review: 0 → 10 (+10)
- **Total: +20 points**

---

## 📊 Expected Final Score:

**After Branch Protection:**
- Current: 5.3/10
- Token-Permissions: 0 → 10 ✅
- Pinned-Dependencies: 4 → 10 ✅
- Branch-Protection: 0 → 10 (after manual setup)
- Code-Review: 0 → 10 (after manual setup)
- **Expected: 7.5-8.0/10** 🎯

---

## 🔍 Verify Changes:

After enabling Branch Protection, check:
1. Scorecard: https://securityscorecards.dev/viewer/?uri=github.com/Szesnasty/pr-cleaner-ai
2. Wait 24h for scorecard to update
3. Check branch settings: https://github.com/Szesnasty/pr-cleaner-ai/settings/branches

---

## 📝 Optional (Nice-to-have):

### Signed Releases (for Signed-Releases: 0 → 10)
```bash
# Generate GPG key
gpg --full-generate-key

# Add to GitHub
gh api user/gpg_keys --method POST -f armored_public_key="$(gpg --armor --export YOUR_KEY_ID)"

# Sign releases
git tag -s v1.2.6 -m "Release 1.2.6"
```

**Note:** This is optional but improves supply chain security.

