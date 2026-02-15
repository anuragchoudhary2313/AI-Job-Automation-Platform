#!/bin/bash

# Frontend Test Coverage Script
# Runs vitest with coverage and enforces 80% minimum threshold

set -e

echo "🧪 Running frontend tests with coverage..."

# Run vitest with coverage
npm run test:coverage

# Check exit code
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Tests failed or coverage is below 80% threshold"
    echo "💡 Run 'open coverage/index.html' to see detailed coverage report"
    exit 1
fi

echo ""
echo "✅ All tests passed and coverage meets threshold!"
echo "📄 HTML report: coverage/index.html"
echo "📄 LCOV report: coverage/lcov.info"
