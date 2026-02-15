#!/bin/bash

# Run all tests with coverage for both backend and frontend
# Fails if either doesn't meet 80% threshold

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   Running All Tests with Coverage         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Backend tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐍 Backend Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend
bash scripts/test-coverage.sh
BACKEND_EXIT=$?
cd ..

echo ""
echo ""

# Frontend tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚛️  Frontend Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend
bash scripts/test-coverage.sh
FRONTEND_EXIT=$?
cd ..

echo ""
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║           Test Summary                     ║"
echo "╚════════════════════════════════════════════╝"

if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
    echo "✅ Backend: PASSED"
    echo "✅ Frontend: PASSED"
    echo ""
    echo "🎉 All tests passed with coverage ≥ 80%!"
    echo ""
    echo "📊 Coverage Reports:"
    echo "   Backend:  backend/htmlcov/index.html"
    echo "   Frontend: frontend/coverage/index.html"
    exit 0
else
    if [ $BACKEND_EXIT -ne 0 ]; then
        echo "❌ Backend: FAILED"
    else
        echo "✅ Backend: PASSED"
    fi
    
    if [ $FRONTEND_EXIT -ne 0 ]; then
        echo "❌ Frontend: FAILED"
    else
        echo "✅ Frontend: PASSED"
    fi
    
    echo ""
    echo "💥 Some tests failed or coverage is below threshold"
    exit 1
fi
