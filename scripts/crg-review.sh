#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-HEAD~1}"
MODE="${2:-incremental}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRG_LOCAL="$REPO_ROOT/.venv/Scripts/code-review-graph.exe"

cd "$REPO_ROOT"

export PYTHONUTF8=1

if [ -x "$CRG_LOCAL" ]; then
  CRG_CMD="$CRG_LOCAL"
elif command -v code-review-graph >/dev/null 2>&1; then
  CRG_CMD="code-review-graph"
else
  echo "code-review-graph is not installed."
  echo "Install with: ./.venv/Scripts/python.exe -m pip install code-review-graph"
  exit 1
fi

echo "Repository: $REPO_ROOT"

if [ "$MODE" = "full" ]; then
  echo "Building full graph..."
  "$CRG_CMD" build --repo "$REPO_ROOT"
else
  echo "Running incremental graph update..."
  "$CRG_CMD" update --repo "$REPO_ROOT" --base "$BASE"
fi

echo "Generating impact report..."
"$CRG_CMD" detect-changes --repo "$REPO_ROOT" --base "$BASE"

echo "Done. Next: ask your AI to run review-delta or review-pr using the graph context."
