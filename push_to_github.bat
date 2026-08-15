@echo off
cd /d "%~dp0"

echo ====================================================
echo   Pushing All Updates to MAIN & Triggering CI/CD
echo ====================================================
echo.
echo Current Directory: %CD%
echo.

echo [1/4] Switching to main branch...
git checkout main

echo [2/4] Staging all files...
git add -A

echo [3/4] Committing updates...
git commit -m "Update domain and brand to krewcanvas.in across application" || echo "Nothing new to commit."

echo [4/4] Pushing to main...
git push origin main

echo.
echo ====================================================
echo   Push to MAIN complete! Check GitHub Actions tab.
echo ====================================================
pause
