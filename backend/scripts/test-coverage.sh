#!/bin/bash

# Backend Test Coverage Script
# Runs pytest with coverage and enforces 80% minimum threshold

set -e

echo "🧪 Running backend tests with coverage..."

# Run pytest with coverage
pytest \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=html \
  --cov-report=xml \
  --cov-fail-under=80 \
  -v

# Check if coverage meets threshold
COVERAGE=$(coverage report | grep TOTAL | awk '{print $4}' | sed 's/%//')

echo ""
echo "📊 Coverage Report:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
coverage report --skip-covered
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if (( $(echo "$COVERAGE < 80" | bc -l) )); then
    echo "❌ Coverage is below 80% threshold: ${COVERAGE}%"
    echo "💡 Run 'open htmlcov/index.html' to see detailed coverage report"
    exit 1
else
    echo "✅ Coverage meets threshold: ${COVERAGE}%"
    echo "📄 HTML report: htmlcov/index.html"
    echo "📄 XML report: coverage.xml"
fi
