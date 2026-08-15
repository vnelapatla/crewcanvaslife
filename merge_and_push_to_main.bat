@echo off
cd /d "%~dp0"

echo ====================================================
echo   Commit, Merge & Deploy KrewCanvas Brand to MAIN
echo ====================================================
echo.

echo [1/5] Staging any modified files...
git add -A

echo.
echo [2/5] Committing latest brand updates...
git commit -m "Update brand name and UI text to KrewCanvas across entire website" || echo "Nothing new to commit on current branch."

echo.
echo [3/5] Pushing to feature branch...
git push origin fix/admin-login-loop || echo "Push to fix/admin-login-loop done or skipped."

echo.
echo [4/5] Merging into main branch...
git checkout main
git pull origin main
git merge fix/admin-login-loop -m "Merge KrewCanvas brand & UI updates into main"

echo.
echo [5/5] Pushing to main to trigger GitHub Actions AWS Deployment...
git push origin main

echo.
echo ====================================================
echo   Merged & Pushed to MAIN! CI/CD Deployment Triggered.
echo ====================================================
pause
