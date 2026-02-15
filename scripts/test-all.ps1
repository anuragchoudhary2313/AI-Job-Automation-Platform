# Run all tests with coverage for both backend and frontend
# Fails if either doesn't meet 80% threshold

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Running All Tests with Coverage         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Backend tests
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🐍 Backend Tests" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Set-Location backend
& .\scripts\test-coverage.ps1
$BackendExit = $LASTEXITCODE
Set-Location ..

Write-Host ""
Write-Host ""

# Frontend tests
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "⚛️  Frontend Tests" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Set-Location frontend
& .\scripts\test-coverage.ps1
$FrontendExit = $LASTEXITCODE
Set-Location ..

Write-Host ""
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Test Summary                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($BackendExit -eq 0 -and $FrontendExit -eq 0) {
    Write-Host "✅ Backend: PASSED" -ForegroundColor Green
    Write-Host "✅ Frontend: PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 All tests passed with coverage ≥ 80%!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Coverage Reports:" -ForegroundColor Cyan
    Write-Host "   Backend:  backend\htmlcov\index.html" -ForegroundColor Cyan
    Write-Host "   Frontend: frontend\coverage\index.html" -ForegroundColor Cyan
    exit 0
} else {
    if ($BackendExit -ne 0) {
        Write-Host "❌ Backend: FAILED" -ForegroundColor Red
    } else {
        Write-Host "✅ Backend: PASSED" -ForegroundColor Green
    }
    
    if ($FrontendExit -ne 0) {
        Write-Host "❌ Frontend: FAILED" -ForegroundColor Red
    } else {
        Write-Host "✅ Frontend: PASSED" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "💥 Some tests failed or coverage is below threshold" -ForegroundColor Red
    exit 1
}
