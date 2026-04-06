param(
  [string]$Base = "HEAD~1",
  [switch]$FullRebuild
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$env:PYTHONUTF8 = "1"

$LocalCrg = Join-Path $RepoRoot ".venv\Scripts\code-review-graph.exe"
if (Test-Path $LocalCrg) {
  $CrgCmd = $LocalCrg
}
elseif (Get-Command code-review-graph -ErrorAction SilentlyContinue) {
  $CrgCmd = "code-review-graph"
}
else {
  Write-Host "code-review-graph is not installed." -ForegroundColor Red
  Write-Host "Install with: .\\.venv\\Scripts\\python.exe -m pip install code-review-graph" -ForegroundColor Yellow
  exit 1
}

Write-Host "Repository: $RepoRoot" -ForegroundColor Cyan

if ($FullRebuild) {
  Write-Host "Building full graph..." -ForegroundColor Yellow
  & $CrgCmd build --repo "$RepoRoot"
}
else {
  Write-Host "Running incremental graph update..." -ForegroundColor Yellow
  & $CrgCmd update --repo "$RepoRoot" --base "$Base"
}

Write-Host "Generating impact report..." -ForegroundColor Yellow
& $CrgCmd detect-changes --repo "$RepoRoot" --base "$Base"

Write-Host "Done. Next: ask your AI to run review-delta or review-pr using the graph context." -ForegroundColor Green
