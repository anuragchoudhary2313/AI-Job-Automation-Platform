#!/usr/bin/env pwsh
# Script to add default exports to page components

$pages = @(
    "c:/Users/anura/ai-job-automation-saas/frontend/src/pages/Jobs/index.tsx",
    "c:/Users/anura/ai-job-automation-saas/frontend/src/pages/Settings/index.tsx",
    "c:/Users/anura/ai-job-automation-saas/frontend/src/pages/Logs/index.tsx",
    "c:/Users/anura/ai-job-automation-saas/frontend/src/pages/Team/index.tsx",
    "c:/Users/anura/ai-job-automation-saas/frontend/src/pages/Landing/index.tsx",
    "c:/Users/anura/ai-job-automation-saas/frontend/src/pages/DemoDashboard.tsx"
)

foreach ($page in $pages) {
    if (Test-Path $page) {
        $content = Get-Content $page -Raw
        $componentName = (Get-Item $page).BaseName
        if ($componentName -eq "index") {
            $componentName = (Get-Item (Split-Path $page)).Name
        }
        
        # Check if default export already exists
        if ($content -notmatch "export default $componentName") {
            # Add default export at the end
            $content = $content.TrimEnd() + "`n`nexport default $componentName;`n"
            Set-Content -Path $page -Value $content -NoNewline
            Write-Host "Added default export to: $page"
        } else {
            Write-Host "Default export already exists in: $page"
        }
    } else {
        Write-Host "File not found: $page"
    }
}

Write-Host "`nDone!"
