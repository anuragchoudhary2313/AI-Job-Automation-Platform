# Frontend Test Coverage Script (PowerShell)
# Runs vitest with coverage and enforces 80% minimum threshold

Write-Host "🧪 Running frontend tests with coverage..." -ForegroundColor Cyan

# Run vitest with coverage
npm run test:coverage

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Tests failed or coverage is below 80% threshold" -ForegroundColor Red
    Write-Host "💡 Open 'coverage/index.html' to see detailed coverage report" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed and coverage meets threshold!" -ForegroundColor Green
Write-Host "📄 HTML report: coverage/index.html" -ForegroundColor Cyan
Write-Host "📄 LCOV report: coverage/lcov.info" -ForegroundColor Cyan
