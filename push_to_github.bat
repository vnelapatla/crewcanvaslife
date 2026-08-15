@echo off
cd /d "%~dp0"

echo ====================================================
echo   Pushing All Updates to MAIN & Triggering CI/CD
echo ====================================================
echo.
echo Current Directory: %CD%
echo.

echo [1/5] Switching to main branch...
git checkout main

echo.
echo [2/5] Staging all files...
git add -A

echo.
echo [3/5] Committing local updates...
git commit -m "Update domain and brand to krewcanvas.in across application" || echo "Nothing new to commit."

echo.
echo [4/5] Pulling latest remote changes from origin/main...
git pull origin main --no-edit || git rebase --continue

echo.
echo [5/5] Pushing to origin/main...
git push origin main

echo.
echo ====================================================
echo   Push to MAIN complete! Check GitHub Actions tab.
echo ====================================================
pause
