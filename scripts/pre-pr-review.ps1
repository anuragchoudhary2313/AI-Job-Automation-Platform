param(
  [string]$Base = "origin/main",
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

Write-Host "Pre-PR Review Pipeline" -ForegroundColor Cyan
Write-Host "Repository: $RepoRoot" -ForegroundColor Cyan
Write-Host "Base: $Base" -ForegroundColor Cyan

if (-not $SkipTests) {
  Write-Host "Running test suite..." -ForegroundColor Yellow
  & "$RepoRoot\scripts\test-all.ps1"
}

Write-Host "Running code-review-graph checks..." -ForegroundColor Yellow
& "$RepoRoot\scripts\crg-review.ps1" -Base "$Base"

Write-Host "Pre-PR checks completed successfully." -ForegroundColor Green
