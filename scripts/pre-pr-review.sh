#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-origin/main}"
SKIP_TESTS="${2:-false}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT"

echo "Pre-PR Review Pipeline"
echo "Repository: $REPO_ROOT"
echo "Base: $BASE"

if [ "$SKIP_TESTS" != "true" ]; then
  echo "Running test suite..."
  bash "$REPO_ROOT/scripts/test-all.sh"
fi

echo "Running code-review-graph checks..."
bash "$REPO_ROOT/scripts/crg-review.sh" "$BASE"

echo "Pre-PR checks completed successfully."
