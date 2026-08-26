Set-Location "C:\Users\Administrator\Desktop\smartstock"

Write-Host "Checking git status..." -ForegroundColor Green
git status

Write-Host "`nAdding all files..." -ForegroundColor Green
git add -A

Write-Host "`nChecking what will be committed..." -ForegroundColor Green
git status

Write-Host "`nCommitting changes..." -ForegroundColor Green
$commitMessage = @"
Add search suggestions, date range selector, CSV export, and fix order total display

- Add SearchSuggestions component with real-time product filtering
- Implement debounced search with keyboard navigation
- Create /api/products endpoint for search suggestions
- Add DateRangeSelector component for analytics filtering
- Update SalesRanking with date range selector
- Add CSV export button to inventory table with proper formatting
- Fix checkout order total showing as 0.00 issue by storing confirmed total
- Update site header to use new search suggestions component
"@

git commit -m $commitMessage

Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "`nDone! Check your GitHub repository to verify the push was successful." -ForegroundColor Cyan
