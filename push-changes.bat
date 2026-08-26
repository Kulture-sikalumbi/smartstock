@echo off
cd /d "C:\Users\Administrator\Desktop\smartstock"

echo Checking git status...
git status

echo.
echo Adding all files...
git add -A

echo.
echo Checking what will be committed...
git status

echo.
echo Committing changes...
git commit -m "Add search suggestions, date range selector, CSV export, and fix order total display

- Add SearchSuggestions component with real-time product filtering
- Implement debounced search with keyboard navigation
- Create /api/products endpoint for search suggestions
- Add DateRangeSelector component for analytics filtering
- Update SalesRanking with date range selector
- Add CSV export button to inventory table with proper formatting
- Fix checkout order total showing as 0.00 issue by storing confirmed total
- Update site header to use new search suggestions component"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Done! Check your GitHub repository to verify the push was successful.
pause
