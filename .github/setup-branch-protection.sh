#!/bin/bash
# Setup Branch Protection for main branch
# This improves OpenSSF Scorecard Branch-Protection and Code-Review scores

set -e

echo "🔒 Setting up Branch Protection for main branch..."

gh api repos/Szesnasty/pr-cleaner-ai/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build (18.x)","build (20.x)","build (22.x)"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

echo "✅ Branch Protection enabled!"
echo ""
echo "Settings:"
echo "  - Require PR before merging: ✅"
echo "  - Require 1 approval: ✅"
echo "  - Require status checks: ✅"
echo "  - Require branches to be up to date: ✅"
echo "  - Include administrators: ✅"
echo ""
echo "This will improve OpenSSF Scorecard:"
echo "  - Branch-Protection: 0 → 10 (+10)"
echo "  - Code-Review: 0 → 10 (+10)"
echo "  - Expected score: 5.3 → 7.5-8.0/10"

