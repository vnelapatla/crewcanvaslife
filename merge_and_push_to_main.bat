@echo off
cd /d "%~dp0"

echo ====================================================
echo   Commit ^& Push Directly to MAIN (Triggering CI/CD)
echo ====================================================
echo.

echo [1/4] Switching to main branch...
git checkout main

echo.
echo [2/4] Pulling latest main...
git pull origin main

echo.
echo [3/4] Staging all modified files...
git add -A

echo.
echo [4/4] Committing ^& Pushing directly to main...
git commit -m "Update domain and brand name to krewcanvas.in across application" || echo "Nothing new to commit."
git push origin main

echo.
echo ====================================================
echo   Pushed directly to MAIN! CI/CD Deployment Triggered.
echo ====================================================
pause
