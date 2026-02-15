# Backend Test Coverage Script (PowerShell)
# Runs pytest with coverage and enforces 80% minimum threshold

Write-Host "🧪 Running backend tests with coverage..." -ForegroundColor Cyan

# Run pytest with coverage
pytest `
  --cov=app `
  --cov-report=term-missing `
  --cov-report=html `
  --cov-report=xml `
  --cov-fail-under=80 `
  -v

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Tests failed or coverage is below 80% threshold" -ForegroundColor Red
    Write-Host "💡 Run 'htmlcov/index.html' to see detailed coverage report" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed and coverage meets threshold!" -ForegroundColor Green
Write-Host "📄 HTML report: htmlcov/index.html" -ForegroundColor Cyan
Write-Host "📄 XML report: coverage.xml" -ForegroundColor Cyan
