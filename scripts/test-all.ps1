# Run all tests with coverage for both backend and frontend.
# Fails if either doesn't meet the 80% threshold.

$ErrorActionPreference = 'Stop'

Write-Host 'Running all tests with coverage' -ForegroundColor Cyan
Write-Host ''

$root = Split-Path -Parent $PSScriptRoot
$backendExit = 1
$frontendExit = 1

Push-Location (Join-Path $root 'backend')
try {
    & .\scripts\test-coverage.ps1
    $backendExit = $LASTEXITCODE
}
finally {
    Pop-Location
}

Write-Host ''

Push-Location (Join-Path $root 'frontend')
try {
    & .\scripts\test-coverage.ps1
    $frontendExit = $LASTEXITCODE
}
finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Test Summary' -ForegroundColor Cyan

if ($backendExit -eq 0 -and $frontendExit -eq 0) {
    Write-Host 'Backend: PASSED' -ForegroundColor Green
    Write-Host 'Frontend: PASSED' -ForegroundColor Green
    Write-Host ''
    Write-Host 'All tests passed with coverage >= 80%.' -ForegroundColor Green
    Write-Host 'Backend report: backend\htmlcov\index.html' -ForegroundColor Cyan
    Write-Host 'Frontend report: frontend\coverage\index.html' -ForegroundColor Cyan
    exit 0
}

if ($backendExit -ne 0) {
    Write-Host 'Backend: FAILED' -ForegroundColor Red
}
else {
    Write-Host 'Backend: PASSED' -ForegroundColor Green
}

if ($frontendExit -ne 0) {
    Write-Host 'Frontend: FAILED' -ForegroundColor Red
}
else {
    Write-Host 'Frontend: PASSED' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Some tests failed or coverage is below threshold.' -ForegroundColor Red
exit 1
